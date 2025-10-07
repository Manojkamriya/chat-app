// import React, { useState } from "react";
// import { FaPaperPlane } from "react-icons/fa6";

// const InputText = ({addMessage}) => {
//     const [message, setMessage] = useState('')
//     console.log("props", addMessage)

//     const sendMessage = () => {
//         if (message.trim()) {
//             addMessage(message)
//             setMessage("")
//         }
//     }
    
//     const handleKeyPress = (e) => {
//         if (e.key === 'Enter' && !e.shiftKey) {
//             e.preventDefault()
//             sendMessage()
//         }
//     }
    
//   return (
//     <div className="inputtext_container">
//       <input
//         type="text"
//         name="message"
//         id="message"
//         placeholder="Type a message..."
//         onChange={(e) => setMessage(e.target.value)}
//         onKeyPress={handleKeyPress}
//         value={message}
//       />
//       <button onClick={sendMessage} className="send_btn">
//         <FaPaperPlane />
//       </button>
//     </div>
//   );
// };

// export default InputText;
import React, { useState, useEffect } from "react";
import { FaPaperPlane } from "react-icons/fa6";

const InputText = ({ addMessage }) => {
  const [message, setMessage] = useState("");
  const [focused, setFocused] = useState(false);

  const sendMessage = () => {
    if (message.trim()) {
      addMessage(message);
      setMessage("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Add/remove 'focused' class to chat section
  useEffect(() => {
    const chatSection = document.querySelector(".chat_section");
    if (!chatSection) return;

    if (focused) {
      chatSection.classList.add("focused");
    } else {
      chatSection.classList.remove("focused");
    }
  }, [focused]);

  return (
    <div className="inputtext_container">
      <input
        type="text"
        placeholder="Type a message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      <button className="send_btn" onClick={sendMessage}>
        <FaPaperPlane />
      </button>
    </div>
  );
};

export default InputText;
