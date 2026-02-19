const chatBubble = document.getElementById("chatBubble");
const chatbot = document.getElementById("chatbot");
const closeBtn = document.getElementById("closeBtn");
const minimizeBtn = document.getElementById("minimizeBtn");
const sendBtn = document.getElementById("sendBtn");
const userInput = document.getElementById("userInput");
const chatBody = document.getElementById("chatBody");
const fileUpload = document.getElementById("fileUpload");

/* Open / Close */
chatBubble.onclick = () => chatbot.classList.add("active");
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
}

function addMessage(text, sender) {
  const wrapper = document.createElement("div");
  wrapper.classList.add("message", sender);

  const bubble = document.createElement("div");
  bubble.classList.add("message-content");
  bubble.innerText = text;

  wrapper.appendChild(bubble);
  chatBody.appendChild(wrapper);
  chatBody.scrollTop = chatBody.scrollHeight;
}

/* S3 Upload */
fileUpload.addEventListener("change", async function () {
  const file = fileUpload.files[0];
  if (!file) return;

  addMessage("Uploading: " + file.name, "user");

  try {
    const presignedRes = await fetch("/generate-presigned-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type
      })
    });

    const { uploadUrl, fileUrl } = await presignedRes.json();

    await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file
    });

    addMessage("File uploaded successfully.", "bot");
    addMessage(fileUrl, "bot");

  } catch (error) {
    addMessage("Upload failed. Please try again.", "bot");
  }

  fileUpload.value = "";
});
