// import React, { useEffect, useRef } from 'react';

// const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // +5:30 hours in ms

// const ChatLists = ({ chats = [], currentUser }) => {
//   const endOfMessagesRef = useRef(null);

//   useEffect(() => {
//     scrollToBottom();
//   }, [chats]);

//   const scrollToBottom = () => {
//     endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
//   };

//   // Convert a timestamp to an IST Date object (add +5:30 once)
//   const toISTDate = (timestamp) => {
//     const d = new Date(timestamp);
//     return new Date(d.getTime() + IST_OFFSET_MS);
//   };

//   // Format time for display using the IST Date computed above
//   const formatTimeIST = (timestamp) => {
//     const ist = toISTDate(timestamp);
//     return ist.toLocaleTimeString('en-IN', {
//       hour: '2-digit',
//       minute: '2-digit',
//       hour12: true,
//     });
//   };

//   // Produce a stable date key in YYYY-MM-DD based on IST date
//   const getDateKey = (timestamp) => {
//     const ist = toISTDate(timestamp);
//     const y = ist.getFullYear();
//     const m = String(ist.getMonth() + 1).padStart(2, '0');
//     const d = String(ist.getDate()).padStart(2, '0');
//     return `${y}-${m}-${d}`;
//   };

//   // Group chats by the YYYY-MM-DD key computed in IST
//   const groupChatsByDate = (chatList) => {
//     const groups = {};
//     for (const chat of chatList) {
//       const key = getDateKey(chat.timestamp);
//       if (!groups[key]) groups[key] = [];
//       groups[key].push(chat);
//     }
//     // sort each group chronologically (old -> new)
//     Object.values(groups).forEach(arr =>
//       arr.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
//     );
//     return groups;
//   };

//   const formatChatDate = (dateKey) => {
//     const todayKey = getDateKey(Date.now());
//     const yesterdayKey = getDateKey(Date.now() - 24 * 60 * 60 * 1000);
//     if (dateKey === todayKey) return 'Today';
//     if (dateKey === yesterdayKey) return 'Yesterday';
//     const [y, m, d] = dateKey.split('-');
//     const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
//     return dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
//   };

//   const grouped = groupChatsByDate(chats);
//   const sortedDateKeys = Object.keys(grouped).sort((a, b) => (a < b ? -1 : 1)); // oldest -> newest

//   const ChatBubble = ({ chat }) => {
//     const isSender = (chat.sender_id || chat.sender) === currentUser;
//     return (
//       <div className={`message_wrapper ${isSender ? 'sender' : 'receiver'}`}>
//         <div className={`chat_bubble ${isSender ? 'sender_bubble' : 'receiver_bubble'}`}>
//           <p className="message_text">{chat.message}</p>
//           <span className="message_time">{formatTimeIST(chat.timestamp)}</span>
//         </div>
//       </div>
//     );
//   };

//   return (
//     <div className="chats_list">
//       {chats.length === 0 ? (
//         <p className="no_messages">No messages yet. Start chatting!</p>
//       ) : (
//         sortedDateKeys.map(dateKey => (
//           <div key={dateKey}>
//             <div className="date_separator">
//               <span>{formatChatDate(dateKey)}</span>
//             </div>
//             {grouped[dateKey].map((chat, idx) => (
//               <ChatBubble key={`${dateKey}-${idx}`} chat={chat} />
//             ))}
//           </div>
//         ))
//       )}
//       <div ref={endOfMessagesRef} />
//     </div>
//   );
// };

// export default ChatLists;
import React, { useEffect, useRef, useState } from 'react';

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // +5:30 hours
const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '👏']; // example emojis
const LONG_PRESS_DURATION = 600; // ms

const ChatLists = ({ chats = [], currentUser }) => {
  const endOfMessagesRef = useRef(null);
  const [reactions, setReactions] = useState({});
  const [emojiPicker, setEmojiPicker] = useState(null); // { chatId, x, y }

  useEffect(() => scrollToBottom(), [chats]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('chatReactions') || '{}');
    setReactions(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem('chatReactions', JSON.stringify(reactions));
  }, [reactions]);

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
    const rect = event.currentTarget.getBoundingClientRect();
    setEmojiPicker({
      chatId,
      x: event.clientX || rect.left + rect.width / 2,
      y: rect.top - 50, // above bubble
    });
  };

  const handleEmojiSelect = (chatId, emoji) => {
    setReactions(prev => ({ ...prev, [chatId]: emoji }));
    setEmojiPicker(null);
  };

  const ChatBubble = ({ chat }) => {
    const isSender = (chat.sender_id || chat.sender) === currentUser;
    const reaction = reactions[chat.id];
    let pressTimer = null;

    const startPress = (e) => {
      e.persist?.();
      pressTimer = setTimeout(() => handleLongPress(chat.id, e), LONG_PRESS_DURATION);
    };

    const endPress = () => clearTimeout(pressTimer);

    return (
      <div
        className={`message_wrapper ${isSender ? 'sender' : 'receiver'}`}
        onMouseDown={startPress}
        onMouseUp={endPress}
        onMouseLeave={endPress}
        onTouchStart={startPress}
        onTouchEnd={endPress}
        onContextMenu={e => e.preventDefault()}
      >
        <div className={`chat_bubble ${isSender ? 'sender_bubble' : 'receiver_bubble'}`}>
          <p className="message_text">{chat.message}</p>
          <span className="message_time">{formatTimeIST(chat.timestamp)}</span>
          {reaction && <span className="reaction">{reaction}</span>}
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
        <div
          className="emoji_picker"
          style={{
            position: 'absolute',
            top: emojiPicker.y,
            left: emojiPicker.x,
            transform: 'translate(-50%, -100%)',
            display: 'flex',
            gap: '6px',
            padding: '6px',
            borderRadius: '12px',
            background: '#f0f0f0',
            zIndex: 100,
          }}
        >
          {EMOJIS.map((emoji, idx) => (
            <span
              key={idx}
              className="emoji"
              style={{ fontSize: '20px', cursor: 'pointer' }}
              onClick={() => handleEmojiSelect(emojiPicker.chatId, emoji)}
            >
              {emoji}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatLists;
