const chatBubble = document.getElementById("chatBubble");
const chatbot = document.getElementById("chatbot");
const closeBtn = document.getElementById("closeBtn");
const minimizeBtn = document.getElementById("minimizeBtn");
const sendBtn = document.getElementById("sendBtn");
const userInput = document.getElementById("userInput");
const chatBody = document.getElementById("chatBody");

/* Open */
chatBubble.onclick = () => {
  chatbot.classList.add("active");
};

/* Close */
closeBtn.onclick = () => {
  chatbot.classList.remove("active");
};

/* Minimize */
minimizeBtn.onclick = () => {
  chatbot.classList.remove("active");
};

/* Send */
sendBtn.onclick = sendMessage;
userInput.addEventListener("keypress", function(e){
  if(e.key === "Enter") sendMessage();
});

function sendMessage(){
  const text = userInput.value.trim();
  if(text === "") return;

  const userMsg = document.createElement("div");
  userMsg.style.textAlign = "right";
  userMsg.style.margin = "10px";
  userMsg.textContent = text;
  chatBody.appendChild(userMsg);

  userInput.value = "";

  showTyping();

  setTimeout(() => {
    removeTyping();
    const botMsg = document.createElement("div");
    botMsg.style.margin = "10px";
    botMsg.textContent = "Thank you! Our team will assist you shortly.";
    chatBody.appendChild(botMsg);
    chatBody.scrollTop = chatBody.scrollHeight;
  }, 2000);
}

function showTyping(){
  const typing = document.createElement("div");
  typing.classList.add("typing");
  typing.id = "typingIndicator";
  typing.innerHTML = "<span></span><span></span><span></span>";
  chatBody.appendChild(typing);
  chatBody.scrollTop = chatBody.scrollHeight;
}

function removeTyping(){
  const typing = document.getElementById("typingIndicator");
  if(typing) typing.remove();
}
