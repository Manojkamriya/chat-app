
import React, { useEffect, useRef } from 'react';

const ChatLists = ({ chats = [], currentUser }) => {
  const endOfMessagesRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [chats]);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const ChatBubble = ({ type, message, timestamp }) => {
    const isSender = type === 'sender';
    return (
      <div className={`message_wrapper ${isSender ? 'sender' : 'receiver'}`}>
        <div className={`chat_bubble ${isSender ? 'sender_bubble' : 'receiver_bubble'}`}>
          <p className="message_text">{message}</p>
          <span className="message_time">
            {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="chats_list">
      {chats.length === 0 ? (
        <p className="no_messages">No messages yet. Start chatting!</p>
      ) : (
        chats.map((chat, index) => (
          <ChatBubble
            key={index}
            type={(chat.sender_id || chat.sender) === currentUser ? 'sender' : 'receiver'}
            message={chat.message}
            timestamp={chat.timestamp}
          />
        ))
      )}
      <div ref={endOfMessagesRef}></div>
    </div>
  );
};

export default ChatLists;
