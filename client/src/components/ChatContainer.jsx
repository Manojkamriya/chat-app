import React, { useEffect, useState, useRef } from "react";
import { FaArrowLeft } from "react-icons/fa6";
import ChatLists from "./ChatLists";
import InputText from "./InputText";
import UserLogin from "./UserLogin";
import UserList from "./UserList";
import { io } from "socket.io-client";

const ChatContainer = () => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const socketRef = useRef(null);
  const isConnectedRef = useRef(false);
  const heartbeatIntervalRef = useRef(null);

  const [chats, setChats] = useState([]);
  const [users, setUsers] = useState([]);
  const [chatUsers, setChatUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [mobileView, setMobileView] = useState(false);
  const [pendingMessages, setPendingMessages] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const selectedUserRef = useRef(null);
  const messageIdCounter = useRef(0);

  useEffect(() => {
    const setHeight = () => {
      const chatLayout = document.querySelector('.chat_layout');
      if (chatLayout) chatLayout.style.height = `${window.innerHeight}px`;
    };

    setHeight();
    window.addEventListener('resize', setHeight);

    return () => window.removeEventListener('resize', setHeight);
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users`);
        const data = await res.json();
        setUsers(data);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!user) return;

    if (!socketRef.current || !isConnectedRef.current) {
      socketRef.current = io(import.meta.env.VITE_API_URL, {
        transports: ["websocket", "polling"],
        auth: { token: user.access_token },
        withCredentials: true,
      });
      isConnectedRef.current = true;
    }

    const socket = socketRef.current;

    socket.emit("getUsers");
    socket.emit("getChatUsers");
    socket.emit("getUnreadCounts");

    socket.on("usersList", setUsers);
    socket.on("chatUsersList", (users) => {
      setChatUsers(users);
      const counts = {};
      users.forEach(u => {
        if (u.unreadCount > 0) {
          counts[u.id] = u.unreadCount;
        }
      });
      setUnreadCounts(prev => ({ ...prev, ...counts }));
    });

    socket.on("chatHistory", (messages) => {
      setChats(messages || []);
    });

    socket.on("receiveMessage", (msg) => {
      const selected = selectedUserRef.current;
      
      if (selected) {
        if (
          (msg.sender === selected.id && msg.receiver === user.id) ||
          (msg.sender === user.id && msg.receiver === selected.id)
        ) {
          setChats((prev) => {
            const exists = prev.some(c => c.id === msg.id);
            if (exists) return prev;
            return [...prev, msg];
          });
          if (msg.sender === selected.id && msg.receiver === user.id) {
            socket.emit("markAsRead", { senderId: selected.id });
          }
        }
      }
      
      if (msg.sender !== user.id && msg.sender !== selected?.id) {
        setUnreadCounts(prev => ({
          ...prev,
          [msg.sender]: (prev[msg.sender] || 0) + 1
        }));
      }
      
      socket.emit("getChatUsers");
    });

    socket.on("receiveQueuedMessage", (msg) => {
      const selected = selectedUserRef.current;
      
      if (selected && msg.sender === selected.id) {
        setChats((prev) => {
          const exists = prev.some(c => c.id === msg.id);
          if (exists) return prev;
          return [...prev, msg].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        });
        socket.emit("markAsRead", { senderId: selected.id });
      } else {
        setUnreadCounts(prev => ({
          ...prev,
          [msg.sender]: (prev[msg.sender] || 0) + 1
        }));
      }
      
      socket.emit("getChatUsers");
    });

    socket.on("messageSent", ({ messageId, status, tempId }) => {
      setPendingMessages(prev => prev.filter(m => m.tempId !== tempId));
    });

    socket.on("messageError", ({ error, tempId }) => {
      console.error("Message error:", error);
      setPendingMessages(prev => 
        prev.map(m => m.tempId === tempId ? { ...m, failed: true } : m)
      );
    });

    socket.on("userOnline", (data) => {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === data.userId ? { ...u, online: true } : u
        )
      );
      setChatUsers((prev) =>
        prev.map((u) =>
          u.id === data.userId ? { ...u, online: true } : u
        )
      );
    });

    socket.on("userOffline", (data) => {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === data.userId ? { ...u, online: false } : u
        )
      );
      setChatUsers((prev) =>
        prev.map((u) =>
          u.id === data.userId ? { ...u, online: false } : u
        )
      );
    });

    socket.on("reactionUpdated", ({ messageId, reactions }) => {
      setChats((prev) =>
        prev.map((chat) =>
          (chat.id === messageId || chat.timestamp === messageId)
            ? { ...chat, reactions }
            : chat
        )
      );
    });

    socket.on("messagesRead", ({ messageIds }) => {
      if (messageIds && messageIds.length > 0) {
        setChats((prev) =>
          prev.map((chat) =>
            messageIds.includes(chat.id)
              ? { ...chat, status: 'read' }
              : chat
          )
        );
      }
    });

    socket.on("messagesDelivered", ({ messageIds }) => {
      if (messageIds && messageIds.length > 0) {
        setChats((prev) =>
          prev.map((chat) =>
            messageIds.includes(chat.id)
              ? { ...chat, status: 'delivered' }
              : chat
          )
        );
      }
    });

    socket.on("unreadCounts", (counts) => {
      setUnreadCounts(counts);
    });

    socket.on("unreadCountUpdated", ({ peerId, unreadCount }) => {
      setUnreadCounts(prev => ({
        ...prev,
        [peerId]: unreadCount
      }));
    });

    socket.emit("deliverPendingMessages");

    socket.on("connect", () => {
      console.log("Socket connected/reconnected");
      socket.emit("deliverPendingMessages");
      socket.emit("heartbeat");
      socket.emit("getUsers");
      socket.emit("getChatUsers");
      socket.emit("getUnreadCounts");
      
      const selected = selectedUserRef.current;
      if (selected) {
        socket.emit("loadMessages", { selectedUserId: selected.id });
        socket.emit("markAsRead", { senderId: selected.id });
      }

      pendingMessages.forEach(msg => {
        if (!msg.failed) {
          socket.emit("privateMessage", msg);
        }
      });
    });

    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    heartbeatIntervalRef.current = setInterval(() => {
      if (socketRef.current) {
        socketRef.current.emit("heartbeat");
      }
    }, 30000);

    socket.emit("heartbeat");

    return () => {
      socket.off("usersList");
      socket.off("chatUsersList");
      socket.off("chatHistory");
      socket.off("receiveMessage");
      socket.off("receiveQueuedMessage");
      socket.off("messageSent");
      socket.off("messageError");
      socket.off("userOnline");
      socket.off("userOffline");
      socket.off("reactionUpdated");
      socket.off("messagesRead");
      socket.off("messagesDelivered");
      socket.off("unreadCounts");
      socket.off("unreadCountUpdated");
      socket.off("connect");
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
    };
  }, [user]);

  const handleSelectUser = (userObj) => {
    setSelectedUser(userObj);
    selectedUserRef.current = userObj;

    if (window.innerWidth <= 768) setMobileView(true);

    setUnreadCounts(prev => ({
      ...prev,
      [userObj.id]: 0
    }));

    if (socketRef.current) {
      socketRef.current.emit("loadMessages", { selectedUserId: userObj.id });
      socketRef.current.emit("markAsRead", { senderId: userObj.id });
    }
  };

  const addMessage = (message) => {
    if (!selectedUser || !socketRef.current) return;

    const tempId = `temp_${Date.now()}_${messageIdCounter.current++}`;
    
    const optimisticMessage = {
      tempId,
      sender: user.id,
      sender_id: user.id,
      receiver: selectedUser.id,
      receiver_id: selectedUser.id,
      message,
      senderAvatar: user.avatar,
      sender_avatar: user.avatar,
      timestamp: new Date().toISOString(),
      status: 'sending',
      reactions: {}
    };

    // setChats(prev => [...prev, optimisticMessage]);
    
    const newMessage = {
      tempId,
      receiverId: selectedUser.id,
      message,
      senderAvatar: user.avatar,
    };

    setPendingMessages(prev => [...prev, newMessage]);
    socketRef.current.emit("privateMessage", newMessage);
  };

  const handleAddReaction = (chat, emoji) => {
    if (!socketRef.current || !chat.id) return;
    const senderId = chat.sender_id || chat.sender;
    const receiverId = chat.receiver_id || chat.receiver;
    const otherUserId = senderId === user.id ? receiverId : senderId;
    socketRef.current.emit("addReaction", {
      messageId: chat.id,
      emoji,
      receiverId: otherUserId,
    });
  };

  const handleRemoveReaction = (chat) => {
    if (!socketRef.current || !chat.id) return;
    const senderId = chat.sender_id || chat.sender;
    const receiverId = chat.receiver_id || chat.receiver;
    const otherUserId = senderId === user.id ? receiverId : senderId;
    socketRef.current.emit("removeReaction", {
      messageId: chat.id,
      receiverId: otherUserId,
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    window.location.reload();
  };

  const handleBack = () => {
    setMobileView(false);
    setSelectedUser(null);
  };

  const totalUnread = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

  return (
    <div className="home">
      {user ? (
        <div className="chat_layout">
          <div className={`sidebar ${mobileView ? "hidden" : ""}`}>
            <div className="sidebar_header">
              <h3>{user.username}</h3>
              {totalUnread > 0 && (
                <span className="total_unread_badge">{totalUnread > 99 ? '99+' : totalUnread}</span>
              )}
              <button className="logout_btn" onClick={handleLogout}>
                Logout
              </button>
            </div>

            <UserList
              users={users}
              chatUsers={chatUsers.map(u => ({
                ...u,
                unreadCount: unreadCounts[u.id] || 0
              }))}
              onSelectUser={handleSelectUser}
              selectedUser={selectedUser?.id}
              currentUser={user.id}
            />
          </div>

          <div
            className={`chat_section ${
              mobileView ? "" : selectedUser ? "" : "hidden"
            }`}
          >
            {selectedUser ? (
              <>
                <div className="chat_header">
                  <button className="back_btn" onClick={handleBack}>
                    <FaArrowLeft />
                  </button>
                  <img
                    src={
                      users.find((u) => u.id === selectedUser.id)?.avatar ||
                      chatUsers.find((u) => u.id === selectedUser.id)?.avatar
                    }
                    alt={selectedUser.username}
                    className="chat_header_avatar"
                  />
                  <div className="chat_user_info">
                    <h4>{selectedUser.username}</h4>
                    <span className="user_status_text">
                      {users.find((u) => u.id === selectedUser.id)?.online ||
                       chatUsers.find((u) => u.id === selectedUser.id)?.online
                        ? "Online"
                        : "Offline"}
                    </span>
                  </div>
                </div>

                <ChatLists 
                  chats={chats} 
                  currentUser={user.id}
                  onAddReaction={handleAddReaction}
                  onRemoveReaction={handleRemoveReaction}
                />
                <InputText addMessage={addMessage} />
              </>
            ) : (
              <div className="no_chat_selected">
                <h2>Select a user to start chatting</h2>
                <p>Choose from your chat history or all users</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <UserLogin setUser={setUser} />
      )}
    </div>
  );
};

export default ChatContainer;
