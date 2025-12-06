// socket.js
const supabase = require('./supabase');

module.exports = (io) => {
  // ------------------- AUTHENTICATE SOCKET -------------------
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error'));

      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data.user) return next(new Error('Authentication error'));

      socket.user = data.user; // attach authenticated user info
      next();
    } catch (err) {
      console.error(err);
      next(new Error('Authentication error'));
    }
  });

  // ------------------- SOCKET CONNECTION -------------------
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.email}`);

    // Update online status
    supabase.from('profiles')
      .update({ online: true, socket_id: socket.id, last_seen: new Date() })
      .eq('id', socket.user.id)
      .then(() => console.log(`Online status updated for ${socket.user.email}`))
      .catch(console.error);

    // ------------------- GET ALL USERS -------------------
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

    // ------------------- LOAD MESSAGES -------------------
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

    // ------------------- SEND MESSAGE -------------------
    socket.on('privateMessage', async (msg) => {
      try {
        // Check if receiver is online
        const { data: receiver } = await supabase
          .from('profiles')
          .select('socket_id, online')
          .eq('id', msg.receiverId)
          .single();

        // Set initial status: 'delivered' if receiver online, otherwise 'sent'
        const initialStatus = receiver?.online && receiver?.socket_id ? 'delivered' : 'sent';

        const { data: savedMessage, error } = await supabase
          .from('chats')
          .insert([{
            sender_id: socket.user.id,
            receiver_id: msg.receiverId,
            message: msg.message,
            sender_avatar: msg.senderAvatar,
            status: initialStatus
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

        if (receiver?.socket_id) io.to(receiver.socket_id).emit('receiveMessage', messageData);
        socket.emit('receiveMessage', messageData);
      } catch (err) {
        console.error(err);
      }
    });

    // ------------------- GET CHAT USERS WITH LAST MESSAGE -------------------
    socket.on('getChatUsers', async () => {
      try {
        const { data: chats } = await supabase
          .from('chats')
          .select('*')
          .or(`sender_id.eq.${socket.user.id},receiver_id.eq.${socket.user.id}`)
          .order('timestamp', { ascending: false });

        const chatMap = new Map();
        chats.forEach((chat) => {
          const otherUser = chat.sender_id === socket.user.id ? chat.receiver_id : chat.sender_id;
          if (!chatMap.has(otherUser)) {
            chatMap.set(otherUser, {
              userId: otherUser,
              lastMessage: chat.message,
              lastMessageTime: chat.timestamp,
            });
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
        }));

        socket.emit('chatUsersList', usersWithChat);
      } catch (err) {
        console.error(err);
      }
    });

    // ------------------- ADD REACTION -------------------
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

    // ------------------- REMOVE REACTION -------------------
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

    // ------------------- MARK MESSAGES AS READ -------------------
    socket.on('markAsRead', async ({ senderId }) => {
      try {
        // Update all unread messages from sender to current user as 'read'
        const { data: updatedMessages, error } = await supabase
          .from('chats')
          .update({ status: 'read' })
          .eq('sender_id', senderId)
          .eq('receiver_id', socket.user.id)
          .neq('status', 'read')
          .select('id');

        if (error) throw error;

        if (updatedMessages && updatedMessages.length > 0) {
          // Notify the sender that their messages were read
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
          
          // Also emit to current user for UI update
          socket.emit('messagesRead', { messageIds, readBy: socket.user.id });
        }
      } catch (err) {
        console.error('Error marking messages as read:', err);
      }
    });

    // ------------------- DELIVER PENDING MESSAGES ON CONNECT -------------------
    socket.on('deliverPendingMessages', async () => {
      try {
        // Find all 'sent' messages where current user is receiver
        const { data: pendingMessages, error } = await supabase
          .from('chats')
          .update({ status: 'delivered' })
          .eq('receiver_id', socket.user.id)
          .eq('status', 'sent')
          .select('id, sender_id');

        if (error) throw error;

        if (pendingMessages && pendingMessages.length > 0) {
          // Group by sender and notify them
          const senderGroups = {};
          pendingMessages.forEach(msg => {
            if (!senderGroups[msg.sender_id]) senderGroups[msg.sender_id] = [];
            senderGroups[msg.sender_id].push(msg.id);
          });

          for (const [senderId, messageIds] of Object.entries(senderGroups)) {
            const { data: sender } = await supabase
              .from('profiles')
              .select('socket_id')
              .eq('id', senderId)
              .single();

            if (sender?.socket_id) {
              io.to(sender.socket_id).emit('messagesDelivered', { messageIds });
            }
          }
        }
      } catch (err) {
        console.error('Error delivering pending messages:', err);
      }
    });

    // ------------------- DISCONNECT -------------------
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
