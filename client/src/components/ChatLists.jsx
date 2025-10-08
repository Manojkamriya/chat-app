import React, { useEffect, useRef, useState } from 'react';
import './EmojiPicker.css'; 

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // +5:30 hours
const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '👏'];
const LONG_PRESS_DURATION = 600; // ms

const ChatLists = ({ chats = [], currentUser }) => {
  const endOfMessagesRef = useRef(null);
  const [reactions, setReactions] = useState({});
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

  const handleLongPress = (chatId, event) => {
    const rect = event.currentTarget ? event.currentTarget.getBoundingClientRect() : { left: 0, width: 0, top: 0 };
    const x = event.clientX || rect.left + rect.width / 2;
    const y = event.clientY ? event.clientY - 60 : rect.top - 50;
    
    // Get emoji picker approximate width (6 emojis * ~36px each + padding)
    const pickerWidth = 240;
    const screenWidth = window.innerWidth;
    const screenPadding = 10; // Minimum padding from screen edge
    
    // Calculate adjusted X position to keep picker in bounds
    let adjustedX = x;
    
    // Check if picker would go off the left edge
    if (x - pickerWidth / 2 < screenPadding) {
      adjustedX = pickerWidth / 2 + screenPadding;
    }
    
    // Check if picker would go off the right edge
    if (x + pickerWidth / 2 > screenWidth - screenPadding) {
      adjustedX = screenWidth - pickerWidth / 2 - screenPadding;
    }
    
    setEmojiPicker({
      chatId,
      x: adjustedX,
      y,
    });
  };

  const handleEmojiSelect = (chatId, emoji) => {
    setReactions(prev => ({ ...prev, [chatId]: emoji }));
    setEmojiPicker(null);
  };

  const ChatBubble = ({ chat }) => {
    const isSender = (chat.sender_id || chat.sender) === currentUser;
    const reaction = reactions[chat.id];
    const pressTimerRef = useRef(null);

    const startPress = (e) => {
      e.preventDefault();
      pressTimerRef.current = setTimeout(() => handleLongPress(chat.id, e), LONG_PRESS_DURATION);
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
        handleLongPress(chat.id, {
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
          <span className="message_time">{formatTimeIST(chat.timestamp)}</span>
          {reaction && <span className={`reaction ${isSender ? 'sender' : 'receiver'}`}>{reaction}</span>}
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
                onClick={() => handleEmojiSelect(emojiPicker.chatId, emoji)}
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