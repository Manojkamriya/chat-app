import React, { useState } from "react";
import { FaPaperPlane } from "react-icons/fa6";

const InputText = ({addMessage}) => {
    const [message, setMessage] = useState('')
    console.log("props", addMessage)

    const sendMessage = () => {
        if (message.trim()) {
            addMessage(message)
            setMessage("")
        }
    }
    
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }
    
  return (
    <div className="inputtext_container">
      <input
        type="text"
        name="message"
        id="message"
        placeholder="Type a message..."
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        value={message}
      />
      <button onClick={sendMessage} className="send_btn">
        <FaPaperPlane />
      </button>
    </div>
  );
};

export default InputText;
