// import React, { useEffect, useState, useRef } from "react";
// import { FaArrowLeft } from "react-icons/fa6";
// import ChatLists from "./ChatLists";
// import InputText from "./InputText";
// import UserLogin from "./UserLogin";
// import UserList from "./UserList";
// import { io } from "socket.io-client";

// const ChatContainer = () => {
//   const [user, setUser] = useState(() => {
//     const storedUser = localStorage.getItem("user");
//     return storedUser ? JSON.parse(storedUser) : null;
//   });

//   const socketRef = useRef(null);
//   const isConnectedRef = useRef(false);

//   const [chats, setChats] = useState([]);
//   const [users, setUsers] = useState([]);
//   const [chatUsers, setChatUsers] = useState([]);
//   const [selectedUser, setSelectedUser] = useState(null);
//   const selectedUserRef = useRef(null);

//   // ---------------- FETCH USERS ----------------
//   useEffect(() => {
//     const fetchUsers = async () => {
//       try {
//         const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users`);
//         const data = await res.json();
//         setUsers(data);
//       } catch (err) {
//         console.error("Error fetching users:", err);
//       }
//     };
//     fetchUsers();
//   }, []);

//   // ---------------- SOCKET CONNECTION ----------------
//   useEffect(() => {
//     if (!user) return;

//     if (!socketRef.current || !isConnectedRef.current) {
//       // socketRef.current = io({
//       //   transports: ["websocket", "polling"],
//       //   auth: { token: user.access_token }, 
//       // });
//       socketRef.current = io(import.meta.env.VITE_API_URL, {
//   transports: ["websocket", "polling"],
//   auth: { token: user.access_token },
//   withCredentials: true, 
// });


//       isConnectedRef.current = true;
//     }

//     const socket = socketRef.current;

//     // Initial fetches
//     socket.emit("getUsers");
//     socket.emit("getChatUsers");

//     // ---------------- SOCKET HANDLERS ----------------
//     socket.on("usersList", setUsers);
//     socket.on("chatUsersList", setChatUsers);

//     socket.on("chatHistory", (messages) => {
//       setChats(messages || []);
//     });

//     socket.on("receiveMessage", (msg) => {
//       const selected = selectedUserRef.current;
//       if (!selected) return;

//       // Only append messages belonging to the current conversation
//       if (
//         (msg.sender === selected.id && msg.receiver === user.id) ||
//         (msg.sender === user.id && msg.receiver === selected.id)
//       ) {
//         setChats((prev) => [...prev, msg]);
//       }
//       socket.emit("getChatUsers");
//     });

//     socket.on("userOnline", (data) => {
//       setUsers((prev) =>
//         prev.map((u) =>
//           u.id === data.userId ? { ...u, online: true } : u
//         )
//       );
//     });

//     socket.on("userOffline", (data) => {
//       setUsers((prev) =>
//         prev.map((u) =>
//           u.id === data.userId ? { ...u, online: false } : u
//         )
//       );
//     });

//     return () => {
//       socket.off("usersList");
//       socket.off("chatUsersList");
//       socket.off("chatHistory");
//       socket.off("receiveMessage");
//       socket.off("userOnline");
//       socket.off("userOffline");
//     };
//   }, [user]);

//   // ---------------- SELECT USER ----------------
//   const handleSelectUser = (userObj) => {
//     setSelectedUser(userObj);
//     selectedUserRef.current = userObj;
//     if (socketRef.current) {
//       socketRef.current.emit("loadMessages", { selectedUserId: userObj.id });
//     }
//   };

//   // ---------------- SEND MESSAGE ----------------
//   const addMessage = (message) => {
//     if (!selectedUser || !socketRef.current) return;
// const newMessage = {
//       receiverId: selectedUser.id,
//       message,
//       senderAvatar: user.avatar
//     };

//     socketRef.current.emit("privateMessage", newMessage);
//   };
// const handleLogout = async () => {

//   if(1){
//       localStorage.removeItem('access_token');
//       localStorage.removeItem('user');
//       console.log('Logged out successfully');
//       window.location.reload(); 
//       return;
//   }
//   try {
//     const user = JSON.parse(localStorage.getItem('user')); // get user object
//     if (!user || !user.id) {
//       console.warn('No user ID found in localStorage');
//       return;
//     }

//     const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/logout`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ user_id: user.id }), // send user_id
//     });

//     const data = await res.json();

//     if (res.ok) {
//       // Clear localStorage
//       localStorage.removeItem('access_token');
//       localStorage.removeItem('user');
//       console.log('Logged out successfully');
//       alert(data.message || 'Logged out successfully');

//       // Optionally reload or navigate
//       window.location.reload(); // or use navigate('/login')
//     } else {
//       console.error('Logout failed:', data.error);
//       alert(data.error || 'Logout failed');
//     }
//   } catch (err) {
//     console.error('Error during logout:', err);
//     alert('Something went wrong while logging out');
//   }
// };



//   return (
//     <div>
//       {user ? (
//         <div className="home">
//           <div className="chat_layout">
//             <div className="sidebar">
//               <div className="sidebar_header">
//                 <h3>{user.username}</h3>
//                 <button className="logout_btn" onClick={handleLogout}>
//                   Logout
//                 </button>
//               </div>

//               <UserList
//                 users={users}
//                 chatUsers={chatUsers}
//                 onSelectUser={handleSelectUser}
//                 selectedUser={selectedUser?.id}
//                 currentUser={user.id}
//               />
//             </div>

//             <div className="chat_section">
//               {selectedUser ? (
//                 <>
//                   <div className="chat_header">
//                     <button
//                       className="back_btn"
//                       onClick={() => setSelectedUser(null)}
//                     >
//                       <FaArrowLeft />
//                     </button>
//                     <img
//                       src={
//                         users.find((u) => u.id === selectedUser.id)?.avatar ||
//                         chatUsers.find((u) => u.id === selectedUser.id)?.avatar
//                       }
//                       alt={selectedUser.username}
//                       className="chat_header_avatar"
//                     />
//                     <div className="chat_user_info">
//                       <h4>{selectedUser.username}</h4>
//                       <span className="user_status_text">
//                         {users.find((u) => u.id === selectedUser.id)?.online
//                           ? "Online"
//                           : "Offline"}
//                       </span>
//                     </div>
//                   </div>

//                   <ChatLists chats={chats} currentUser={user.id} />
//                   <InputText addMessage={addMessage} />
//                 </>
//               ) : (
//                 <div className="no_chat_selected">
//                   <h2>Select a user to start chatting</h2>
//                   <p>Choose from your chat history or all users</p>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       ) : (
//         <UserLogin setUser={setUser} />
//       )}
//     </div>
//   );
// };

// export default ChatContainer;
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

  const [chats, setChats] = useState([]);
  const [users, setUsers] = useState([]);
  const [chatUsers, setChatUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [mobileView, setMobileView] = useState(false); // mobile toggle
  const selectedUserRef = useRef(null);
useEffect(() => {
  const setHeight = () => {
    const chatLayout = document.querySelector('.chat_layout');
    if (chatLayout) chatLayout.style.height = `${window.innerHeight}px`;
  };

  setHeight();
  window.addEventListener('resize', setHeight);

  return () => window.removeEventListener('resize', setHeight);
}, []);

  // ---------------- FETCH USERS ----------------
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

  // ---------------- SOCKET CONNECTION ----------------
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

    socket.on("usersList", setUsers);
    socket.on("chatUsersList", setChatUsers);

    socket.on("chatHistory", (messages) => {
      setChats(messages || []);
    });

    socket.on("receiveMessage", (msg) => {
      const selected = selectedUserRef.current;
      if (!selected) return;

      if (
        (msg.sender === selected.id && msg.receiver === user.id) ||
        (msg.sender === user.id && msg.receiver === selected.id)
      ) {
        setChats((prev) => [...prev, msg]);
      }
      socket.emit("getChatUsers");
    });

    socket.on("userOnline", (data) => {
      setUsers((prev) =>
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
    });

    return () => {
      socket.off("usersList");
      socket.off("chatUsersList");
      socket.off("chatHistory");
      socket.off("receiveMessage");
      socket.off("userOnline");
      socket.off("userOffline");
    };
  }, [user]);

  // ---------------- SELECT USER ----------------
  const handleSelectUser = (userObj) => {
    setSelectedUser(userObj);
    selectedUserRef.current = userObj;

    if (window.innerWidth <= 768) setMobileView(true);

    if (socketRef.current) {
      socketRef.current.emit("loadMessages", { selectedUserId: userObj.id });
    }
  };

  // ---------------- SEND MESSAGE ----------------
  const addMessage = (message) => {
    if (!selectedUser || !socketRef.current) return;

    const newMessage = {
      receiverId: selectedUser.id,
      message,
      senderAvatar: user.avatar,
    };

    socketRef.current.emit("privateMessage", newMessage);
  };

  // ---------------- LOGOUT ----------------
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    window.location.reload();
  };

  const handleBack = () => {
    setMobileView(false);
    setSelectedUser(null);
  };

  return (
    <div className="home">
      {user ? (
        <div className="chat_layout">
          <div className={`sidebar ${mobileView ? "hidden" : ""}`}>
            <div className="sidebar_header">
              <h3>{user.username}</h3>
              <button className="logout_btn" onClick={handleLogout}>
                Logout
              </button>
            </div>

            <UserList
              users={users}
              chatUsers={chatUsers}
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
                      {users.find((u) => u.id === selectedUser.id)?.online
                        ? "Online"
                        : "Offline"}
                    </span>
                  </div>
                </div>

                <ChatLists chats={chats} currentUser={user.id} />
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
