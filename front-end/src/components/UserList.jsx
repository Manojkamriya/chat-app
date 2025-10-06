// import React, { useState } from 'react'
// import { FaUsers, FaComments } from 'react-icons/fa6'

// const UserList = ({ users, chatUsers, onSelectUser, selectedUser, currentUser }) => {
//     const [activeTab, setActiveTab] = useState('chats')

//     return (
//         <div className='userlist_container'>
//             <div className='userlist_tabs'>
//                 <button 
//                     className={activeTab === 'chats' ? 'active' : ''} 
//                     onClick={() => setActiveTab('chats')}
//                 >
//                     <FaComments /> Chats
//                 </button>
//                 <button 
//                     className={activeTab === 'users' ? 'active' : ''} 
//                     onClick={() => setActiveTab('users')}
//                 >
//                     <FaUsers /> All Users
//                 </button>
//             </div>

//             <div className='userlist_items'>
//                 {activeTab === 'chats' && (
//                     <>
//                         {chatUsers.length === 0 ? (
//                             <p className='no_chats'>No chats yet. Start a conversation!</p>
//                         ) : (
//                             chatUsers.map((user, index) => (
//                                 <div 
//                                     key={index} 
//                                     className={`user_item ${selectedUser === user.username ? 'selected' : ''}`}
//                                     onClick={() => onSelectUser(user.username)}
//                                 >
//                                     <img src={user.avatar} alt={user.username} />
//                                     <div className='user_info'>
//                                         <div className='user_header'>
//                                             <h4>{user.username}</h4>
//                                             <span className={`status ${user.online ? 'online' : 'offline'}`}></span>
//                                         </div>
//                                         <p className='last_message'>{user.lastMessage}</p>
//                                     </div>
//                                 </div>
//                             ))
//                         )}
//                     </>
//                 )}

//                 {activeTab === 'users' && (
//                     <>
//                         {users.map((user, index) => (
//                             user.username !== currentUser && (
//                                 <div 
//                                     key={index} 
//                                     className={`user_item ${selectedUser === user.username ? 'selected' : ''}`}
//                                     onClick={() => onSelectUser(user.username)}
//                                 >
//                                     <img src={user.avatar} alt={user.username} />
//                                     <div className='user_info'>
//                                         <div className='user_header'>
//                                             <h4>{user.username}</h4>
//                                             <span className={`status ${user.online ? 'online' : 'offline'}`}></span>
//                                         </div>
//                                         <p className='user_status'>{user.online ? 'Online' : 'Offline'}</p>
//                                     </div>
//                                 </div>
//                             )
//                         ))}
//                     </>
//                 )}
//             </div>
//         </div>
//     )
// }

// export default UserList
import React, { useState } from "react";
import { FaUsers, FaComments } from "react-icons/fa6";

const UserList = ({ users, chatUsers, onSelectUser, selectedUser, currentUser }) => {
  const [activeTab, setActiveTab] = useState("chats");

  return (
    <div className="userlist_container">
      <div className="userlist_tabs">
        <button
          className={activeTab === "chats" ? "active" : ""}
          onClick={() => setActiveTab("chats")}
        >
          <FaComments /> Chats
        </button>
        <button
          className={activeTab === "users" ? "active" : ""}
          onClick={() => setActiveTab("users")}
        >
          <FaUsers /> All Users
        </button>
      </div>

      <div className="userlist_items">
        {/* Chats Tab */}
        {activeTab === "chats" &&
          (chatUsers.length === 0 ? (
            <p className="no_chats">No chats yet. Start a conversation!</p>
          ) : (
            chatUsers.map((u) => (
              <div
                key={u.id}
                className={`user_item ${selectedUser === u.id ? "selected" : ""}`}
                onClick={() => onSelectUser(u)}
              >
                <img src={u.avatar} alt={u.username} />
                <div className="user_info">
                  <div className="user_header">
                    <h4>{u.username}</h4>
                    <span className={`status ${u.online ? "online" : "offline"}`}></span>
                  </div>
                  <p className="last_message">{u.lastMessage || ""}</p>
                </div>
              </div>
            ))
          ))}

        {/* All Users Tab */}
        {activeTab === "users" &&
          users
            .filter((u) => u.id !== currentUser)
            .map((u) => (
              <div
                key={u.id}
                className={`user_item ${selectedUser === u.id ? "selected" : ""}`}
                onClick={() => onSelectUser(u)}
              >
                <img src={u.avatar} alt={u.username} />
                <div className="user_info">
                  <div className="user_header">
                    <h4>{u.username}</h4>
                    <span className={`status ${u.online ? "online" : "offline"}`}></span>
                  </div>
                  <p className="user_status">{u.online ? "Online" : "Offline"}</p>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
};

export default UserList;
