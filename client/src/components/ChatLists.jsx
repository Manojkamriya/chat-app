import React, { useEffect, useRef, useState } from 'react';
import './EmojiPicker.css'; 
import './MessageStatus.css';

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // +5:30 hours
const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '👏'];
const LONG_PRESS_DURATION = 600; // ms

const MessageStatus = ({ status, isSender }) => {
  if (!isSender) return null;
  
  const getStatusIcon = () => {
    switch (status) {
      case 'read':
        return (
          <svg viewBox="0 0 16 11" width="16" height="11" className="status_read">
            <path fill="currentColor" d="M11.07 0.15L5.43 5.89L3.93 4.39L1.03 7.29L5.43 11.69L13.97 3.05L11.07 0.15ZM11.07 0.15L14.97 4.05L12.07 6.95" />
          </svg>
        );
      case 'delivered':
        return (
          <svg viewBox="0 0 16 11" width="16" height="11" className="status_delivered">
            <path fill="currentColor" d="M11.07 0.15L5.43 5.89L3.93 4.39L1.03 7.29L5.43 11.69L13.97 3.05L11.07 0.15ZM11.07 0.15L14.97 4.05L12.07 6.95" />
          </svg>
        );
      case 'sending':
        return (
          <svg viewBox="0 0 12 12" width="12" height="12" className="status_sending">
            <circle cx="6" cy="6" r="5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="20" strokeDashoffset="10">
              <animate attributeName="stroke-dashoffset" values="0;31.4" dur="1s" repeatCount="indefinite"/>
            </circle>
          </svg>
        );
      case 'queued':
        return (
          <svg viewBox="0 0 12 11" width="12" height="11" className="status_queued">
            <circle cx="6" cy="5.5" r="4" fill="none" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M6 3v3l2 1" stroke="currentColor" strokeWidth="1" fill="none"/>
          </svg>
        );
      case 'sent':
      default:
        return (
          <svg viewBox="0 0 12 11" width="12" height="11" className="status_sent">
            <path fill="currentColor" d="M9.07 0.15L3.43 5.89L1.93 4.39L0.03 6.29L3.43 9.69L10.97 2.05L9.07 0.15Z" />
          </svg>
        );
    }
  };
  
  return (
    <span className={`message_status ${status || 'sent'}`}>
      {getStatusIcon()}
    </span>
  );
};

const ChatLists = ({ chats = [], currentUser, onAddReaction, onRemoveReaction }) => {
  const endOfMessagesRef = useRef(null);
  const [emojiPicker, setEmojiPicker] = useState(null);

  useEffect(() => scrollToBottom(), [chats]);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toISTDate = (timestamp) => {
    const d = new Date(timestamp);
    return new Date(d.getTime() + IST_OFFSET_MS);
  };

  const formatTimeIST = (timestamp) => {
    const ist = toISTDate(timestamp);
    return ist.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const getDateKey = (timestamp) => {
    const ist = toISTDate(timestamp);
    const y = ist.getFullYear();
    const m = String(ist.getMonth() + 1).padStart(2, '0');
    const d = String(ist.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const groupChatsByDate = (chatList) => {
    const groups = {};
    for (const chat of chatList) {
      const key = getDateKey(chat.timestamp);
      if (!groups[key]) groups[key] = [];
      groups[key].push(chat);
    }
    Object.values(groups).forEach(arr => arr.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)));
    return groups;
  };

  const formatChatDate = (dateKey) => {
    const todayKey = getDateKey(Date.now());
    const yesterdayKey = getDateKey(Date.now() - 24 * 60 * 60 * 1000);
    if (dateKey === todayKey) return 'Today';
    if (dateKey === yesterdayKey) return 'Yesterday';
    const [y, m, d] = dateKey.split('-');
    const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
    return dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const grouped = groupChatsByDate(chats);
  const sortedDateKeys = Object.keys(grouped).sort((a, b) => (a < b ? -1 : 1));

  const handleLongPress = (chat, event) => {
    const rect = event.currentTarget ? event.currentTarget.getBoundingClientRect() : { left: 0, width: 0, top: 0 };
    const x = event.clientX || rect.left + rect.width / 2;
    const y = event.clientY ? event.clientY - 60 : rect.top - 50;
    
    const pickerWidth = 240;
    const screenWidth = window.innerWidth;
    const screenPadding = 10;
    
    let adjustedX = x;
    
    if (x - pickerWidth / 2 < screenPadding) {
      adjustedX = pickerWidth / 2 + screenPadding;
    }
    
    if (x + pickerWidth / 2 > screenWidth - screenPadding) {
      adjustedX = screenWidth - pickerWidth / 2 - screenPadding;
    }
    
    setEmojiPicker({
      chat,
      x: adjustedX,
      y,
    });
  };

  const handleEmojiSelect = (chat, emoji) => {
    const existingReaction = chat.reactions?.[currentUser];
    if (existingReaction === emoji) {
      onRemoveReaction?.(chat);
    } else {
      onAddReaction?.(chat, emoji);
    }
    setEmojiPicker(null);
  };

  const ChatBubble = ({ chat }) => {
    const isSender = (chat.sender_id || chat.sender) === currentUser;
    const reactions = chat.reactions || {};
    const reactionEntries = Object.entries(reactions);
    const pressTimerRef = useRef(null);

    const startPress = (e) => {
      e.preventDefault();
      pressTimerRef.current = setTimeout(() => handleLongPress(chat, e), LONG_PRESS_DURATION);
    };

    const endPress = () => {
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current);
        pressTimerRef.current = null;
      }
    };

    const handleTouch = (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      pressTimerRef.current = setTimeout(() => {
        handleLongPress(chat, {
          clientX: touch.clientX,
          clientY: touch.clientY,
          currentTarget: e.currentTarget,
        });
      }, LONG_PRESS_DURATION);
    };

    return (
      <div
        className={`message_wrapper ${isSender ? 'sender' : 'receiver'}`}
        onMouseDown={startPress}
        onMouseUp={endPress}
        onMouseLeave={endPress}
        onTouchStart={handleTouch}
        onTouchEnd={endPress}
        onTouchCancel={endPress}
        onTouchMove={endPress}
        onContextMenu={e => e.preventDefault()}
      >
        <div className={`chat_bubble ${isSender ? 'sender_bubble' : 'receiver_bubble'}`}>
          <p className="message_text">{chat.message}</p>
          <div className="message_footer">
            <span className="message_time">{formatTimeIST(chat.timestamp)}</span>
            <MessageStatus status={chat.status} isSender={isSender} />
          </div>
          {reactionEntries.length > 0 && (
            <span className={`reaction ${isSender ? 'sender' : 'receiver'}`}>
              {reactionEntries.map(([userId, emoji]) => emoji).join('')}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="chats_list" style={{ position: 'relative' }}>
      {chats.length === 0 ? (
        <p className="no_messages">No messages yet. Start chatting!</p>
      ) : (
        sortedDateKeys.map(dateKey => (
          <div key={dateKey}>
            <div className="date_separator">
              <span>{formatChatDate(dateKey)}</span>
            </div>
            {grouped[dateKey].map((chat, idx) => (
              <ChatBubble key={`${dateKey}-${idx}`} chat={chat} />
            ))}
          </div>
        ))
      )}
      <div ref={endOfMessagesRef} />

      {emojiPicker && (
        <>
          <div
            className="emoji_picker_backdrop"
            onClick={() => setEmojiPicker(null)}
          />
          <div
            className="emoji_picker"
            style={{
              top: emojiPicker.y,
              left: emojiPicker.x,
            }}
          >
            {EMOJIS.map((emoji, idx) => (
              <span
                key={idx}
                className="emoji"
                onClick={() => handleEmojiSelect(emojiPicker.chat, emoji)}
              >
                {emoji}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ChatLists;