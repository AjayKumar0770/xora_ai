const chatBody = document.querySelector(".chat-body");
const messageInput = document.querySelector(".message-input");
const sendMessage = document.querySelector("#send-message");
const fileInput = document.querySelector("#file-input");
const fileUploadWrapper = document.querySelector(".file-upload-wrapper");
const fileCancelButton = fileUploadWrapper.querySelector("#file-cancel");
const pdfInput = document.querySelector("#pdf-input");
const pdfUploadWrapper = document.querySelector(".pdf-upload-wrapper");
const pdfCancelButton = pdfUploadWrapper.querySelector("#pdf-cancel");
const sideToggler = document.querySelector("#side-toggler");
const newChatButton = document.querySelector("#new-chat");
const showIframeButton = document.querySelector("#show-iframe");
const closeIframeButton = document.querySelector("#close-iframe");
const iframeOverlay = document.querySelector("#iframe-overlay");
const closeChatbot = document.querySelector("#close-chatbot");
const chatSessionsContainer = document.querySelector("#chat-sessions");

// API setup
// const API_KEY = "AIzaSyCCj0OLJMaaOajuPmd6fHEujfXJ6epaKcc";
// const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${API_KEY}`;


const API_KEY = "AIzaSyDgtm8Fp1PBajlZuQz0LikLtF6wZ7d8Tzs";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

// `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;
// // Initialize user message and file data
const userData = {
  message: null,
  file: {
    data: null,
    mime_type: null,
  },
  pdf: {
    data: null,
    mime_type: null,
  },
};

// Store chat history
let chatHistory = [];
let chatSessions = [];
let chatCounter = 1;

const initialInputHeight = messageInput.scrollHeight;

// Create message element with dynamic classes and return it
const createMessageElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};

// Generate bot response using API
const generateBotResponse = async (incomingMessageDiv) => {
  const messageElement = incomingMessageDiv.querySelector(".message-text");

  // Add user message to chat history
  chatHistory.push({
    role: "user",
    parts: [
      { text: userData.message },
      ...(userData.file.data ? [{ inline_data: userData.file }] : []),
      ...(userData.pdf.data ? [{ inline_data: userData.pdf }] : []),
    ],
  });

  // API request options
  const requestOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: chatHistory,
    }),
  };

  try {
    // Fetch bot response from API
    const response = await fetch(API_URL, requestOptions);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error.message);

    // Extract and display bot's response text
    const apiResponseText = data.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, "$1").trim();
    messageElement.innerText = apiResponseText;

    // Add bot response to chat history
    chatHistory.push({
      role: "model",
      parts: [{ text: apiResponseText }],
    });
  } catch (error) {
    // Handle error in API response
    console.log(error);
    messageElement.innerText = error.message;
    messageElement.style.color = "#ff0000";
  } finally {
    // Reset user's file and pdf data, removing thinking indicator and scroll chat to bottom
    userData.file = {};
    userData.pdf = {};
    incomingMessageDiv.classList.remove("thinking");
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
  }
};

// Handle outgoing user messages
const handleOutgoingMessage = (e) => {
  e.preventDefault();
  userData.message = messageInput.value.trim();
  messageInput.value = "";
  messageInput.dispatchEvent(new Event("input"));
  fileUploadWrapper.classList.remove("file-uploaded");
  pdfUploadWrapper.classList.remove("pdf-uploaded");

  // Create and display user message
  const messageContent = `<div class="message-text"></div>
                          ${userData.file.data ? `<img src="data:${userData.file.mime_type};base64,${userData.file.data}" class="attachment" />` : ""}
                          ${userData.pdf.data ? `<embed src="data:${userData.pdf.mime_type};base64,${userData.pdf.data}" class="attachment" type="application/pdf" />` : ""}`;

  const outgoingMessageDiv = createMessageElement(messageContent, "user-message");
  outgoingMessageDiv.querySelector(".message-text").innerText = userData.message;
  chatBody.appendChild(outgoingMessageDiv);
  chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });

  // Simulate bot response with thinking indicator after a delay
  setTimeout(() => {
    const messageContent = `<img class="bot-avatar" src="robotic.png" alt="Chatbot Logo" width="50" height="50">
          </img>
          <div class="message-text">
            <div class="thinking-indicator">
              <div class="dot"></div>
              <div class="dot"></div>
              <div class="dot"></div>
            </div>
          </div>`;

    const incomingMessageDiv = createMessageElement(messageContent, "bot-message", "thinking");
    chatBody.appendChild(incomingMessageDiv);
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
    generateBotResponse(incomingMessageDiv);
  }, 600);
};

// Adjust input field height dynamically
messageInput.addEventListener("input", () => {
  messageInput.style.height = `${initialInputHeight}px`;
  messageInput.style.height = `${messageInput.scrollHeight}px`;
  document.querySelector(".chat-form").style.borderRadius = messageInput.scrollHeight > initialInputHeight ? "15px" : "32px";
});

// Handle Enter key press for sending messages
messageInput.addEventListener("keydown", (e) => {
  const userMessage = e.target.value.trim();
  if (e.key === "Enter" && !e.shiftKey && userMessage && window.innerWidth > 768) {
    handleOutgoingMessage(e);
  }
});

// Handle file input change and preview the selected file
fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    fileInput.value = "";
    fileUploadWrapper.querySelector("img").src = e.target.result;
    fileUploadWrapper.classList.add("file-uploaded");
    const base64String = e.target.result.split(",")[1];

    // Store file data in userData
    userData.file = {
      data: base64String,
      mime_type: file.type,
    };
  };

  reader.readAsDataURL(file);
});

// Handle PDF input change and preview the selected PDF
pdfInput.addEventListener("change", () => {
  const file = pdfInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    pdfInput.value = "";
    pdfUploadWrapper.classList.add("pdf-uploaded");
    const base64String = e.target.result.split(",")[1];

    // Store PDF data in userData
    userData.pdf = {
      data: base64String,
      mime_type: file.type,
    };
  };

  reader.readAsDataURL(file);
});

// Cancel file upload
fileCancelButton.addEventListener("click", () => {
  userData.file = {};
  fileUploadWrapper.classList.remove("file-uploaded");
});

// Cancel PDF upload
pdfCancelButton.addEventListener("click", () => {
  userData.pdf = {};
  pdfUploadWrapper.classList.remove("pdf-uploaded");
});

// Initialize emoji picker and handle emoji selection
const picker = new EmojiMart.Picker({
  theme: "light",
  skinTonePosition: "none",
  previewPosition: "none",
  onEmojiSelect: (emoji) => {
    const { selectionStart: start, selectionEnd: end } = messageInput;
    messageInput.setRangeText(emoji.native, start, end, "end");
    messageInput.focus();
  },
  onClickOutside: (e) => {
    if (e.target.id === "emoji-picker") {
      document.body.classList.toggle("show-emoji-picker");
    } else {
      document.body.classList.remove("show-emoji-picker");
    }
  },
});

document.querySelector(".chat-form").appendChild(picker);

sendMessage.addEventListener("click", (e) => handleOutgoingMessage(e));
document.querySelector("#file-upload").addEventListener("click", () => fileInput.click());
document.querySelector("#pdf-upload").addEventListener("click", () => pdfInput.click());
closeChatbot.addEventListener("click", () => document.body.classList.remove("show-chatbot"));

// Toggle side section visibility
sideToggler.addEventListener("click", () => {
  document.body.classList.toggle("show-side-section");
});

// Create a new chat session and store the old chat in history
newChatButton.addEventListener("click", () => {
  if (chatHistory.length > 0) {
    // Store current chat history in chatSessions
    const chatSessionName = `Chatbot ${chatCounter}`;
    chatSessions.push({ name: chatSessionName, history: [...chatHistory] });

    // Create a new chat session element
    const chatSessionElement = document.createElement("div");
    chatSessionElement.classList.add("chat-session");
    chatSessionElement.innerHTML = `${chatSessionName} <button class="delete-btn">Delete</button>`;
    chatSessionElement.addEventListener("click", () => {
      // Load the selected chat session
      chatHistory = chatSessions.find(session => session.name === chatSessionName).history;
      renderChatHistory();
    });

    // Add event listener for delete button
    chatSessionElement.querySelector(".delete-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      deleteChatSession(chatSessionName, chatSessionElement);
    });

    // Append the new chat session to the side section
    chatSessionsContainer.appendChild(chatSessionElement);

    // Increment chat counter
    chatCounter++;

    // Reset chat history and chat body
    chatHistory = [];
    chatBody.innerHTML = `
      <div class="message bot-message">
        <img class="bot-avatar" src="robotic.png" alt="Chatbot Logo" width="50" height="50">
        </img>
        <div class="message-text"> Hey there <br /> How can I help you today? </div>
      </div>
    `;
  }
});

// Function to render chat history
const renderChatHistory = () => {
  chatBody.innerHTML = '';
  chatHistory.forEach(message => {
    const messageContent = `<div class="message-text">${message.parts[0].text}</div>`;
    const messageElement = createMessageElement(messageContent, message.role === "user" ? "user-message" : "bot-message");
    chatBody.appendChild(messageElement);
  });
  chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
};

// Function to delete a chat session
const deleteChatSession = (chatSessionName, chatSessionElement) => {
  chatSessions = chatSessions.filter(session => session.name !== chatSessionName);
  chatSessionElement.remove();
};

// Show iframe overlay
showIframeButton.addEventListener("click", () => {
  iframeOverlay.style.display = "flex";
});

// Close iframe overlay
closeIframeButton.addEventListener("click", () => {
  iframeOverlay.style.display = "none";
});