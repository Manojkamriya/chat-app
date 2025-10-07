import React, { useState, useEffect } from "react";
import { FaPaperPlane } from "react-icons/fa6";

const InputText = ({ addMessage }) => {
  const [message, setMessage] = useState("");
  const [keyboardOffset, setKeyboardOffset] = useState(0);

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

  useEffect(() => {
    const chatSection = document.querySelector(".chat_section");

    if (window.visualViewport && chatSection) {
      const handleResize = () => {
        const viewportHeight = window.visualViewport.height;
        const totalHeight = window.innerHeight;

        // Difference shows how much keyboard is taking
        const keyboardHeight = totalHeight - viewportHeight;

        // If keyboard is open, reduce chat height accordingly
        if (keyboardHeight > 100) {
          chatSection.style.height = `${viewportHeight}px`;
          setKeyboardOffset(keyboardHeight);
        } else {
          chatSection.style.height = "100vh";
          setKeyboardOffset(0);
        }
      };

      window.visualViewport.addEventListener("resize", handleResize);
      return () => {
        window.visualViewport.removeEventListener("resize", handleResize);
      };
    }
  }, []);

  return (
    <div className="inputtext_container" style={{ marginBottom: keyboardOffset > 0 ? keyboardOffset * 0.02 : 0 }}>
      <input
        type="text"
        placeholder="Type a message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
      />
      <button className="send_btn" onClick={sendMessage}>
        <FaPaperPlane />
      </button>
    </div>
  );
};

export default InputText;
