// // import React, { useState, useEffect } from "react";
// // import { FaPaperPlane } from "react-icons/fa6";

// // const InputText = ({ addMessage }) => {
// //   const [message, setMessage] = useState("");
// //   const [keyboardOffset, setKeyboardOffset] = useState(0);

// //   const sendMessage = () => {
// //     if (message.trim()) {
// //       addMessage(message);
// //       setMessage("");
// //     }
// //   };

// //   const handleKeyPress = (e) => {
// //     if (e.key === "Enter" && !e.shiftKey) {
// //       e.preventDefault();
// //       sendMessage();
// //     }
// //   };

// //   useEffect(() => {
// //     const chatSection = document.querySelector(".chat_section");

// //     if (window.visualViewport && chatSection) {
// //       const handleResize = () => {
// //         const viewportHeight = window.visualViewport.height;
// //         const totalHeight = window.innerHeight;

// //         // Difference shows how much keyboard is taking
// //         const keyboardHeight = totalHeight - viewportHeight;

// //         // If keyboard is open, reduce chat height accordingly
// //         if (keyboardHeight > 100) {
// //           chatSection.style.height = `${viewportHeight}px`;
// //           setKeyboardOffset(keyboardHeight);
// //         } else {
// //           chatSection.style.height = "100vh";
// //           setKeyboardOffset(0);
// //         }
// //       };

// //       window.visualViewport.addEventListener("resize", handleResize);
// //       return () => {
// //         window.visualViewport.removeEventListener("resize", handleResize);
// //       };
// //     }
// //   }, []);

// //   return (
// //     <div className="inputtext_container" style={{ marginBottom: keyboardOffset > 0 ? keyboardOffset * 0.02 : 0 }}>
// //       <input
// //         type="text"
// //         placeholder="Type a message..."
// //         value={message}
// //         onChange={(e) => setMessage(e.target.value)}
// //         onKeyPress={handleKeyPress}
// //       />
// //       <button className="send_btn" onClick={sendMessage}>
// //         <FaPaperPlane />
// //       </button>
// //     </div>
// //   );
// // };

// // export default InputText;
// import React, { useState, useEffect } from "react";
// import { FaPaperPlane } from "react-icons/fa6";

// const InputText = ({ addMessage }) => {
//   const [message, setMessage] = useState("");
//   const [keyboardOpen, setKeyboardOpen] = useState(false);

//   const sendMessage = () => {
//     if (message.trim()) {
//       addMessage(message);
//       setMessage("");
//     }
//   };

//   const handleKeyPress = (e) => {
//     if (e.key === "Enter" && !e.shiftKey) {
//       e.preventDefault();
//       sendMessage();
//     }
//   };

//   useEffect(() => {
//     const chatSection = document.querySelector(".chat_section");
//     if (!chatSection || !window.visualViewport) return;

//     const handleResize = () => {
//       const viewportHeight = window.visualViewport.height;
//       const totalHeight = window.innerHeight;
//       const keyboardHeight = totalHeight - viewportHeight;

//       if (keyboardHeight > 150) {
//         // Keyboard open
//         chatSection.style.height = `${viewportHeight}px`;
//         chatSection.style.overflow = "auto";
//         setKeyboardOpen(true);
//       } else {
//         // Keyboard closed
//         setKeyboardOpen(false);
//         // Wait a bit to let viewport animation complete
//         setTimeout(() => {
//           chatSection.style.height = "";
//           chatSection.style.overflow = "";
//         }, 300);
//       }
//     };

//     window.visualViewport.addEventListener("resize", handleResize);
//     return () => {
//       window.visualViewport.removeEventListener("resize", handleResize);
//     };
//   }, []);

//   return (
//     <div
//       className="inputtext_container"
//       style={{
//         position: "sticky",
//         bottom: 0,
//         background: "#fff",
//         display: "flex",
//         alignItems: "center",
//         padding: "8px",
//         borderTop: "1px solid #ddd",
//         transition: "transform 0.2s ease",
//         transform: keyboardOpen ? "translateY(0)" : "translateY(0)",
//       }}
//     >
//       <input
//         type="text"
//         placeholder="Type a message..."
//         value={message}
//         onChange={(e) => setMessage(e.target.value)}
//         onKeyPress={handleKeyPress}
//         style={{
//           flex: 1,
//           padding: "10px",
//           border: "1px solid #ccc",
//           borderRadius: "20px",
//           outline: "none",
//         }}
//       />
//       <button
//         className="send_btn"
//         onClick={sendMessage}
//         style={{
//           marginLeft: "8px",
//           background: "#0a84ff",
//           color: "#fff",
//           border: "none",
//           borderRadius: "50%",
//           width: "36px",
//           height: "36px",
//           display: "flex",
//           alignItems: "center",
//           justifyContent: "center",
//         }}
//       >
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
  const [keyboardOpen, setKeyboardOpen] = useState(false);

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
    if (!chatSection || !window.visualViewport) return;

    const handleResize = () => {
      const viewportHeight = window.visualViewport.height;
      const totalHeight = window.innerHeight;
      const keyboardHeight = totalHeight - viewportHeight;

      if (keyboardHeight > 150) {
        // Keyboard open
        chatSection.style.height = `${viewportHeight}px`;
        chatSection.style.overflow = "auto";
        setKeyboardOpen(true);
      } else {
        // Keyboard closed
        setKeyboardOpen(false);
        setTimeout(() => {
          chatSection.style.height = "";
          chatSection.style.overflow = "";
        }, 300);
      }
    };

    window.visualViewport.addEventListener("resize", handleResize);
    return () => {
      window.visualViewport.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div
      className="inputtext_container"
      style={{
        position: "sticky",
        bottom: 0,
        background: "#f0f2f5",
        display: "flex",
        alignItems: "center",
        padding: "10px 20px",
        gap: "10px",
        borderTop: "1px solid #ddd",
        transition: "transform 0.2s ease",
        transform: keyboardOpen ? "translateY(0)" : "translateY(0)",
      }}
    >
      <input
        type="text"
        placeholder="Type a message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        style={{
          flex: 1,
          height: "45px",
          border: "none",
          borderRadius: "25px",
          padding: "0 20px",
          fontSize: "15px",
          outline: "none",
        }}
      />
      <button
        onClick={sendMessage}
        style={{
          width: "45px",
          height: "45px",
          borderRadius: "50%",
          backgroundColor: "#008069", // WhatsApp green
          color: "#fff",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "18px",
        }}
      >
        <FaPaperPlane />
      </button>
    </div>
  );
};

export default InputText;
