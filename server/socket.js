const supabase = require('./supabase');
const { encode, decode } = require('@msgpack/msgpack');

module.exports = (io) => {
  const HEARTBEAT_TIMEOUT = 60000;
  const pendingMessageQueue = new Map();

  const heartbeatChecker = setInterval(async () => {
    try {
      const { data: staleUsers, error } = await supabase
        .from('profiles')
        .select('id, socket_id')
        .eq('online', true)
        .lt('last_seen', new Date(Date.now() - HEARTBEAT_TIMEOUT).toISOString());

      if (error) {
        console.error('Error checking heartbeat:', error);
        return;
      }

      if (staleUsers && staleUsers.length > 0) {
        for (const user of staleUsers) {
          console.log(`Marking user ${user.id} as offline (no heartbeat)`);
          
          await supabase
            .from('profiles')
            .update({ online: false, socket_id: null, last_seen: new Date() })
            .eq('id', user.id);

          if (user.socket_id) {
            const staleSocket = io.sockets.sockets.get(user.socket_id);
            if (staleSocket) {
              staleSocket.disconnect(true);
            }
          }

          io.emit('userOffline', { userId: user.id, online: false });
        }
      }
    } catch (err) {
      console.error('Heartbeat checker error:', err);
    }
  }, 30000);

  io.on('close', () => {
    clearInterval(heartbeatChecker);
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error'));

      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data.user) return next(new Error('Authentication error'));

      socket.user = data.user;
      next();
    } catch (err) {
      console.error(err);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.email}`);

    supabase.from('profiles')
      .update({ online: true, socket_id: socket.id, last_seen: new Date() })
      .eq('id', socket.user.id)
      .then(() => {
        console.log(`Online status updated for ${socket.user.email}`);
        io.emit('userOnline', { userId: socket.user.id, online: true });
      })
      .catch(console.error);

    socket.on('getUsers', async () => {
      try {
        const { data: users } = await supabase
          .from('profiles')
          .select('id, username, avatar, online')
          .neq('id', socket.user.id);
        socket.emit('usersList', users);
      } catch (err) {
        console.error(err);
      }
    });

    socket.on('loadMessages', async ({ selectedUserId }) => {
      try {
        const roomId = [socket.user.id, selectedUserId].sort().join('-');
        socket.join(roomId);

        const { data: messages } = await supabase
          .from('chats')
          .select('*')
          .or(
            `and(sender_id.eq.${socket.user.id},receiver_id.eq.${selectedUserId}),and(sender_id.eq.${selectedUserId},receiver_id.eq.${socket.user.id})`
          )
          .order('timestamp', { ascending: true });

        socket.emit('chatHistory', messages || []);
      } catch (err) {
        console.error(err);
      }
    });

    socket.on('privateMessage', async (msg) => {
      try {
        const { data: receiver } = await supabase
          .from('profiles')
          .select('socket_id, online')
          .eq('id', msg.receiverId)
          .single();

        const isReceiverOnline = receiver?.online && receiver?.socket_id;
        const initialStatus = isReceiverOnline ? 'delivered' : 'queued';

        const { data: savedMessage, error } = await supabase
          .from('chats')
          .insert([{
            sender_id: socket.user.id,
            receiver_id: msg.receiverId,
            message: msg.message,
            sender_avatar: msg.senderAvatar,
            status: initialStatus,
            queued_at: initialStatus === 'queued' ? new Date().toISOString() : null
          }])
          .select()
          .single();

        if (error) throw error;

        const messageData = {
          id: savedMessage.id,
          sender: socket.user.id,
          receiver: msg.receiverId,
          sender_id: savedMessage.sender_id,
          receiver_id: savedMessage.receiver_id,
          message: savedMessage.message,
          senderAvatar: savedMessage.sender_avatar,
          sender_avatar: savedMessage.sender_avatar,
          timestamp: savedMessage.timestamp,
          reactions: savedMessage.reactions || {},
          status: savedMessage.status || 'sent',
        };

        if (isReceiverOnline && receiver.socket_id) {
          io.to(receiver.socket_id).emit('receiveMessage', messageData);
        } else {
          if (!pendingMessageQueue.has(msg.receiverId)) {
            pendingMessageQueue.set(msg.receiverId, []);
          }
          pendingMessageQueue.get(msg.receiverId).push(savedMessage.id);
        }
        
        socket.emit('receiveMessage', messageData);
        socket.emit('messageSent', { 
          messageId: savedMessage.id, 
          status: initialStatus,
          tempId: msg.tempId 
        });
      } catch (err) {
        console.error(err);
        socket.emit('messageError', { error: 'Failed to send message', tempId: msg.tempId });
      }
    });

    socket.on('getChatUsers', async () => {
      try {
        const { data: chats } = await supabase
          .from('chats')
          .select('*')
          .or(`sender_id.eq.${socket.user.id},receiver_id.eq.${socket.user.id}`)
          .order('timestamp', { ascending: false });

        const chatMap = new Map();
        const unreadCounts = new Map();

        chats.forEach((chat) => {
          const otherUser = chat.sender_id === socket.user.id ? chat.receiver_id : chat.sender_id;
          
          if (!chatMap.has(otherUser)) {
            chatMap.set(otherUser, {
              userId: otherUser,
              lastMessage: chat.message,
              lastMessageTime: chat.timestamp,
              lastMessageStatus: chat.status,
              lastMessageSenderId: chat.sender_id
            });
          }

          if (chat.receiver_id === socket.user.id && chat.status !== 'read') {
            unreadCounts.set(otherUser, (unreadCounts.get(otherUser) || 0) + 1);
          }
        });

        const userIds = [...chatMap.keys()];
        const { data: users } = await supabase
          .from('profiles')
          .select('id, username, avatar, online')
          .in('id', userIds);

        const usersWithChat = users.map((u) => ({
          ...u,
          lastMessage: chatMap.get(u.id).lastMessage,
          lastMessageTime: chatMap.get(u.id).lastMessageTime,
          lastMessageStatus: chatMap.get(u.id).lastMessageStatus,
          lastMessageSenderId: chatMap.get(u.id).lastMessageSenderId,
          unreadCount: unreadCounts.get(u.id) || 0
        }));

        usersWithChat.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));

        socket.emit('chatUsersList', usersWithChat);
      } catch (err) {
        console.error(err);
      }
    });

    socket.on('addReaction', async ({ messageId, emoji, receiverId }) => {
      try {
        const { data: message } = await supabase
          .from('chats')
          .select('reactions')
          .eq('id', messageId)
          .single();

        const reactions = message?.reactions || {};
        reactions[socket.user.id] = emoji;

        const { error } = await supabase
          .from('chats')
          .update({ reactions })
          .eq('id', messageId);

        if (error) throw error;

        const reactionData = { messageId, reactions };
        
        socket.emit('reactionUpdated', reactionData);
        
        const { data: receiver } = await supabase
          .from('profiles')
          .select('socket_id')
          .eq('id', receiverId)
          .single();
        
        if (receiver?.socket_id) {
          io.to(receiver.socket_id).emit('reactionUpdated', reactionData);
        }
      } catch (err) {
        console.error('Error adding reaction:', err);
      }
    });

    socket.on('removeReaction', async ({ messageId, receiverId }) => {
      try {
        const { data: message } = await supabase
          .from('chats')
          .select('reactions')
          .eq('id', messageId)
          .single();

        const reactions = message?.reactions || {};
        delete reactions[socket.user.id];

        const { error } = await supabase
          .from('chats')
          .update({ reactions })
          .eq('id', messageId);

        if (error) throw error;

        const reactionData = { messageId, reactions };
        
        socket.emit('reactionUpdated', reactionData);
        
        const { data: receiver } = await supabase
          .from('profiles')
          .select('socket_id')
          .eq('id', receiverId)
          .single();
        
        if (receiver?.socket_id) {
          io.to(receiver.socket_id).emit('reactionUpdated', reactionData);
        }
      } catch (err) {
        console.error('Error removing reaction:', err);
      }
    });

    socket.on('markAsRead', async ({ senderId }) => {
      try {
        const { data: updatedMessages, error } = await supabase
          .from('chats')
          .update({ status: 'read', read_at: new Date().toISOString() })
          .eq('sender_id', senderId)
          .eq('receiver_id', socket.user.id)
          .neq('status', 'read')
          .select('id');

        if (error) throw error;

        if (updatedMessages && updatedMessages.length > 0) {
          const { data: sender } = await supabase
            .from('profiles')
            .select('socket_id')
            .eq('id', senderId)
            .single();

          const messageIds = updatedMessages.map(m => m.id);
          
          if (sender?.socket_id) {
            io.to(sender.socket_id).emit('messagesRead', { 
              messageIds, 
              readBy: socket.user.id 
            });
          }
          
          socket.emit('messagesRead', { messageIds, readBy: socket.user.id });
          
          socket.emit('unreadCountUpdated', { 
            peerId: senderId, 
            unreadCount: 0 
          });
        }
      } catch (err) {
        console.error('Error marking messages as read:', err);
      }
    });

    socket.on('heartbeat', async () => {
      try {
        await supabase
          .from('profiles')
          .update({ last_seen: new Date(), online: true })
          .eq('id', socket.user.id);
      } catch (err) {
        console.error('Heartbeat update error:', err);
      }
    });

    socket.on('deliverPendingMessages', async () => {
      try {
        const { data: queuedMessages, error: fetchError } = await supabase
          .from('chats')
          .select('id, sender_id, message, sender_avatar, timestamp, reactions, receiver_id')
          .eq('receiver_id', socket.user.id)
          .eq('status', 'queued')
          .order('timestamp', { ascending: true });

        if (fetchError) throw fetchError;

        if (queuedMessages && queuedMessages.length > 0) {
          const messageIds = queuedMessages.map(m => m.id);
          
          const { error: updateError } = await supabase
            .from('chats')
            .update({ status: 'delivered', delivered_at: new Date().toISOString() })
            .in('id', messageIds);

          if (updateError) throw updateError;

          queuedMessages.forEach(msg => {
            const messageData = {
              id: msg.id,
              sender: msg.sender_id,
              receiver: msg.receiver_id,
              sender_id: msg.sender_id,
              receiver_id: msg.receiver_id,
              message: msg.message,
              senderAvatar: msg.sender_avatar,
              sender_avatar: msg.sender_avatar,
              timestamp: msg.timestamp,
              reactions: msg.reactions || {},
              status: 'delivered',
            };
            socket.emit('receiveQueuedMessage', messageData);
          });

          const senderGroups = {};
          queuedMessages.forEach(msg => {
            if (!senderGroups[msg.sender_id]) senderGroups[msg.sender_id] = [];
            senderGroups[msg.sender_id].push(msg.id);
          });

          for (const [senderId, msgIds] of Object.entries(senderGroups)) {
            const { data: sender } = await supabase
              .from('profiles')
              .select('socket_id')
              .eq('id', senderId)
              .single();

            if (sender?.socket_id) {
              io.to(sender.socket_id).emit('messagesDelivered', { messageIds: msgIds });
            }
          }
        }

        const { data: sentMessages, error: sentError } = await supabase
          .from('chats')
          .update({ status: 'delivered', delivered_at: new Date().toISOString() })
          .eq('receiver_id', socket.user.id)
          .eq('status', 'sent')
          .select('id, sender_id');

        if (!sentError && sentMessages && sentMessages.length > 0) {
          const senderGroups = {};
          sentMessages.forEach(msg => {
            if (!senderGroups[msg.sender_id]) senderGroups[msg.sender_id] = [];
            senderGroups[msg.sender_id].push(msg.id);
          });

          for (const [senderId, msgIds] of Object.entries(senderGroups)) {
            const { data: sender } = await supabase
              .from('profiles')
              .select('socket_id')
              .eq('id', senderId)
              .single();

            if (sender?.socket_id) {
              io.to(sender.socket_id).emit('messagesDelivered', { messageIds: msgIds });
            }
          }
        }

        pendingMessageQueue.delete(socket.user.id);

      } catch (err) {
        console.error('Error delivering pending messages:', err);
      }
    });

    socket.on('getUnreadCounts', async () => {
      try {
        const { data: unreadMessages } = await supabase
          .from('chats')
          .select('sender_id')
          .eq('receiver_id', socket.user.id)
          .neq('status', 'read');

        const unreadCounts = {};
        if (unreadMessages) {
          unreadMessages.forEach(msg => {
            unreadCounts[msg.sender_id] = (unreadCounts[msg.sender_id] || 0) + 1;
          });
        }

        socket.emit('unreadCounts', unreadCounts);
      } catch (err) {
        console.error('Error getting unread counts:', err);
      }
    });

    socket.on('registerPublicKey', async ({ publicKey, version }) => {
      try {
        await supabase
          .from('profiles')
          .update({ 
            public_key: publicKey, 
            encryption_version: version 
          })
          .eq('id', socket.user.id);
        
        console.log(`Public key registered for ${socket.user.email}`);
      } catch (err) {
        console.error('Error registering public key:', err);
      }
    });

    socket.on('requestPublicKey', async ({ peerId }) => {
      try {
        const { data: peer } = await supabase
          .from('profiles')
          .select('public_key')
          .eq('id', peerId)
          .single();

        if (peer?.public_key) {
          socket.emit('peerPublicKey', { 
            peerId, 
            publicKey: peer.public_key 
          });
        }
      } catch (err) {
        console.error('Error fetching peer public key:', err);
      }
    });

    socket.on('sendEncryptedMessage', async (msg) => {
      try {
        const { data: receiver } = await supabase
          .from('profiles')
          .select('socket_id, online, public_key')
          .eq('id', msg.receiverId)
          .single();

        const isReceiverOnline = receiver?.online && receiver?.socket_id;
        const initialStatus = isReceiverOnline ? 'delivered' : 'queued';

        const { data: savedMessage, error } = await supabase
          .from('chats')
          .insert([{
            sender_id: socket.user.id,
            receiver_id: msg.receiverId,
            message: msg.encrypted ? null : msg.message,
            ciphertext: msg.ciphertext || null,
            iv: msg.iv || null,
            encryption_version: msg.version || null,
            is_encrypted: msg.encrypted || false,
            sender_avatar: msg.senderAvatar,
            status: initialStatus,
            queued_at: initialStatus === 'queued' ? new Date().toISOString() : null
          }])
          .select()
          .single();

        if (error) throw error;

        const messageData = {
          id: savedMessage.id,
          sender: socket.user.id,
          receiver: msg.receiverId,
          sender_id: savedMessage.sender_id,
          receiver_id: savedMessage.receiver_id,
          message: savedMessage.message,
          ciphertext: savedMessage.ciphertext,
          iv: savedMessage.iv,
          encrypted: savedMessage.is_encrypted,
          version: savedMessage.encryption_version,
          senderAvatar: savedMessage.sender_avatar,
          sender_avatar: savedMessage.sender_avatar,
          timestamp: savedMessage.timestamp,
          reactions: savedMessage.reactions || {},
          status: savedMessage.status || 'sent',
        };

        if (isReceiverOnline && receiver.socket_id) {
          io.to(receiver.socket_id).emit('receiveMessage', messageData);
        }
        
        socket.emit('receiveMessage', messageData);
        socket.emit('messageSent', { 
          messageId: savedMessage.id, 
          status: initialStatus,
          tempId: msg.tempId 
        });
      } catch (err) {
        console.error(err);
        socket.emit('messageError', { error: 'Failed to send message', tempId: msg.tempId });
      }
    });

    socket.on('getKeyBackup', async () => {
      try {
        const { data } = await supabase
          .from('key_backups')
          .select('*')
          .eq('user_id', socket.user.id)
          .single();

        socket.emit('keyBackup', data || null);
      } catch (err) {
        console.error('Error getting key backup:', err);
        socket.emit('keyBackup', null);
      }
    });

    socket.on('saveKeyBackup', async (backupData) => {
      try {
        const { error } = await supabase
          .from('key_backups')
          .upsert({
            user_id: socket.user.id,
            public_key: backupData.publicKey,
            encrypted_key: backupData.encryptedKey,
            salt: backupData.salt,
            iv: backupData.iv,
            updated_at: new Date().toISOString()
          });

        if (error) throw error;
        
        socket.emit('keyBackupSaved', { success: true });
      } catch (err) {
        console.error('Error saving key backup:', err);
        socket.emit('keyBackupSaved', { success: false, error: err.message });
      }
    });

    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.user.email}`);
      try {
        await supabase.from('profiles')
          .update({ online: false, last_seen: new Date(), socket_id: null })
          .eq('id', socket.user.id);

        socket.broadcast.emit('userOffline', { userId: socket.user.id, online: false });
      } catch (err) {
        console.error(err);
      }
    });
  });
};
