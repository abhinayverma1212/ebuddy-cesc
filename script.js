const chatBubble = document.getElementById("chatBubble");
const chatbot = document.getElementById("chatbot");
const closeBtn = document.getElementById("closeBtn");
const minimizeBtn = document.getElementById("minimizeBtn");
const sendBtn = document.getElementById("sendBtn");
const userInput = document.getElementById("userInput");
const chatBody = document.getElementById("chatBody");
const fileUpload = document.getElementById("fileUpload");

/* Open */
chatBubble.onclick = () => chatbot.classList.add("active");

/* Close */
closeBtn.onclick = () => chatbot.classList.remove("active");
minimizeBtn.onclick = () => chatbot.classList.remove("active");

/* Send */
sendBtn.onclick = sendMessage;
userInput.addEventListener("keypress", e => {
  if (e.key === "Enter") sendMessage();
});

function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  addMessage(text, "user");
  userInput.value = "";

  showTyping();

  setTimeout(() => {
    removeTyping();
    addMessage("Thank you! Our team will assist you shortly.", "bot");
  }, 1200);
}

function addMessage(text, sender) {
  const message = document.createElement("div");
  message.classList.add("message", sender);

  const content = document.createElement("div");
  content.classList.add("message-content");
  content.textContent = text;

  message.appendChild(content);
  chatBody.appendChild(message);
  chatBody.scrollTop = chatBody.scrollHeight;
}

function showTyping() {
  const typing = document.createElement("div");
  typing.classList.add("message", "bot");
  typing.id = "typingIndicator";

  const bubble = document.createElement("div");
  bubble.classList.add("message-content", "typing");
  bubble.innerHTML = "<span></span><span></span><span></span>";

  typing.appendChild(bubble);
  chatBody.appendChild(typing);
  chatBody.scrollTop = chatBody.scrollHeight;
}

function removeTyping() {
  const typing = document.getElementById("typingIndicator");
  if (typing) typing.remove();
}

/* File Upload */
fileUpload.addEventListener("change", async function () {
  const file = fileUpload.files[0];
  if (!file) return;

  addMessage("Uploading: " + file.name, "user");

  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch("/upload", {
      method: "POST",
      body: formData
    });

    const result = await response.json();

    if (result.fileUrl) {
      addMessage("File uploaded successfully!", "bot");

      const fileMessage = document.createElement("div");
      fileMessage.classList.add("message", "bot");

      const content = document.createElement("div");
      content.classList.add("message-content");

      const link = document.createElement("a");
      link.href = result.fileUrl;
      link.target = "_blank";
      link.textContent = "View Uploaded File";

      content.appendChild(link);
      fileMessage.appendChild(content);
      chatBody.appendChild(fileMessage);
    }

  } catch (err) {
    addMessage("Upload failed. Please try again.", "bot");
  }

  fileUpload.value = "";
});
