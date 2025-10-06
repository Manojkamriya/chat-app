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
        const { data: savedMessage, error } = await supabase
          .from('chats')
          .insert([{
            sender_id: socket.user.id,
            receiver_id: msg.receiverId,
            message: msg.message,
            sender_avatar: msg.senderAvatar
          }])
          .select()
          .single();

        if (error) throw error;

        const { data: receiver } = await supabase
          .from('profiles')
          .select('socket_id')
          .eq('id', msg.receiverId)
          .single();

        const messageData = {
          sender: socket.user.id,
          receiver: msg.receiverId,
          message: savedMessage.message,
          senderAvatar: savedMessage.sender_avatar,
          timestamp: savedMessage.timestamp,
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
