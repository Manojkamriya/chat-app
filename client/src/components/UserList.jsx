import React, { useState } from "react";
import { FaUsers, FaComments } from "react-icons/fa6";

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return date.toLocaleDateString('en-IN', { weekday: 'short' });
  } else {
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }
};

const truncateMessage = (message, maxLength = 30) => {
  if (!message) return '';
  return message.length > maxLength ? message.substring(0, maxLength) + '...' : message;
};

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
                <div className="avatar_container">
                  <img src={u.avatar} alt={u.username} />
                  <span className={`status_dot ${u.online ? "online" : "offline"}`}></span>
                </div>
                <div className="user_info">
                  <div className="user_header">
                    <h4>{u.username}</h4>
                    <span className="last_time">{formatTime(u.lastMessageTime)}</span>
                  </div>
                  <div className="message_preview">
                    <p className="last_message">
                      {u.lastMessageSenderId === currentUser && (
                        <span className="you_prefix">You: </span>
                      )}
                      {truncateMessage(u.lastMessage)}
                    </p>
                    {u.unreadCount > 0 && (
                      <span className="unread_badge">
                        {u.unreadCount > 99 ? '99+' : u.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ))}

        {activeTab === "users" &&
          users
            .filter((u) => u.id !== currentUser)
            .map((u) => (
              <div
                key={u.id}
                className={`user_item ${selectedUser === u.id ? "selected" : ""}`}
                onClick={() => onSelectUser(u)}
              >
                <div className="avatar_container">
                  <img src={u.avatar} alt={u.username} />
                  <span className={`status_dot ${u.online ? "online" : "offline"}`}></span>
                </div>
                <div className="user_info">
                  <div className="user_header">
                    <h4>{u.username}</h4>
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
