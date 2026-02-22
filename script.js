const chatBubble = document.getElementById("chatBubble");
const chatbot = document.getElementById("chatbot");
const closeBtn = document.getElementById("closeBtn");
const minimizeBtn = document.getElementById("minimizeBtn");
const sendBtn = document.getElementById("sendBtn");
const audioBtn = document.getElementById("audioBtn");
const userInput = document.getElementById("userInput");
const chatBody = document.getElementById("chatBody");
const fileUpload = document.getElementById("fileUpload");
const inputWrapper = document.getElementById("inputWrapper");
const recordingUI = document.getElementById("recordingUI");
const recordingTimer = document.getElementById("recordingTimer");
const cancelRecording = document.getElementById("cancelRecording");

let isRecording = false;
let mediaRecorder = null;
let audioChunks = [];
let recordingStartTime = null;
let timerInterval = null;
let audioStream = null;

/* Open / Close */
chatBubble.onclick = () => chatbot.classList.add("active");
closeBtn.onclick = () => {
  chatbot.classList.remove("active");
  // Stop recording if active when closing
  if (isRecording) {
    stopRecording(true); // true = cancel without sending
  }
};
minimizeBtn.onclick = () => {
  chatbot.classList.remove("active");
  // Stop recording if active when minimizing
  if (isRecording) {
    stopRecording(true);
  }
};

/* Input Focus / Blur Events to Toggle Send/Audio Buttons */
userInput.addEventListener("input", () => {
  const hasText = userInput.value.trim().length > 0;
  
  if (hasText) {
    // Show send button, hide audio button
    sendBtn.classList.add("active");
    audioBtn.classList.add("hidden");
  } else {
    // Show audio button, hide send button
    sendBtn.classList.remove("active");
    audioBtn.classList.remove("hidden");
  }
});

/* Send Message Function */
sendBtn.onclick = sendMessage;
userInput.addEventListener("keypress", e => {
  if (e.key === "Enter") sendMessage();
});

function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  addMessage(text, "user");
  userInput.value = "";
  
  // Reset button states - show audio, hide send
  sendBtn.classList.remove("active");
  audioBtn.classList.remove("hidden");

  // Add typing indicator
  const typingWrapper = document.createElement("div");
  typingWrapper.classList.add("message", "bot");

  const typingBubble = document.createElement("div");
  typingBubble.classList.add("message-content");
  typingBubble.innerText = "Typing...";

  typingWrapper.appendChild(typingBubble);
  chatBody.appendChild(typingWrapper);
  chatBody.scrollTop = chatBody.scrollHeight;

  // Simulate bot response delay
  setTimeout(() => {
    typingBubble.innerText = "Thanks for your message!";
    chatBody.scrollTop = chatBody.scrollHeight;
  }, 1000);
}

/* Add Message to Chat */
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

/* Add Audio Message to Chat */
function addAudioMessage(audioBlob, duration, sender = "user") {
  const wrapper = document.createElement("div");
  wrapper.classList.add("message", sender);

  const bubble = document.createElement("div");
  bubble.classList.add("message-content", "audio-message");

  // Create audio element (hidden)
  const audio = document.createElement("audio");
  audio.src = URL.createObjectURL(audioBlob);
  audio.preload = "metadata";

  // Play button
  const playBtn = document.createElement("button");
  playBtn.classList.add("play-btn");
  playBtn.innerHTML = '<i class="fas fa-play"></i>';
  
  let isPlaying = false;
  playBtn.onclick = () => {
    if (isPlaying) {
      audio.pause();
      playBtn.innerHTML = '<i class="fas fa-play"></i>';
      isPlaying = false;
    } else {
      audio.play();
      playBtn.innerHTML = '<i class="fas fa-pause"></i>';
      isPlaying = true;
    }
  };

  audio.onended = () => {
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
    isPlaying = false;
  };

  // Waveform visualization
  const waveform = document.createElement("div");
  waveform.classList.add("audio-waveform-display");
  for (let i = 0; i < 15; i++) {
    const bar = document.createElement("span");
    waveform.appendChild(bar);
  }

  // Duration display
  const durationSpan = document.createElement("span");
  durationSpan.classList.add("audio-duration");
  durationSpan.textContent = formatTime(duration);

  bubble.appendChild(playBtn);
  bubble.appendChild(waveform);
  bubble.appendChild(durationSpan);

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

/* Audio Recording Logic - WhatsApp Style */

// Long press detection
let pressTimer = null;
let isPressing = false;

// Mouse events
audioBtn.addEventListener("mousedown", startPressTimer);
audioBtn.addEventListener("mouseup", handlePressEnd);
audioBtn.addEventListener("mouseleave", handlePressEnd);

// Touch events for mobile
audioBtn.addEventListener("touchstart", (e) => {
  e.preventDefault();
  startPressTimer();
});
audioBtn.addEventListener("touchend", (e) => {
  e.preventDefault();
  handlePressEnd();
});
audioBtn.addEventListener("touchcancel", (e) => {
  e.preventDefault();
  handlePressEnd();
});

function startPressTimer() {
  if (isRecording) return;
  
  isPressing = true;
  
  // Start recording immediately on press (WhatsApp style)
  pressTimer = setTimeout(() => {
    if (isPressing) {
      startRecording();
    }
  }, 0); // Immediate start like WhatsApp
}

function handlePressEnd() {
  if (pressTimer) {
    clearTimeout(pressTimer);
    pressTimer = null;
  }
  
  isPressing = false;
  
  // If was recording, stop and send
  if (isRecording) {
    stopRecording(false); // false = send the recording
  }
}

// Cancel button handler
cancelRecording.onclick = () => {
  if (isRecording) {
    stopRecording(true); // true = cancel without sending
  }
};

async function startRecording() {
  try {
    // Request microphone access
    audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Create MediaRecorder
    const options = { mimeType: 'audio/webm' };
    mediaRecorder = new MediaRecorder(audioStream, options);
    
    audioChunks = [];
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };
    
    mediaRecorder.onstop = handleRecordingStop;
    
    // Start recording
    mediaRecorder.start();
    isRecording = true;
    recordingStartTime = Date.now();
    
    // Update UI
    inputWrapper.classList.add("hidden");
    recordingUI.classList.add("active");
    audioBtn.classList.add("recording");
    
    // Start timer
    updateTimer();
    timerInterval = setInterval(updateTimer, 1000);
    
    console.log("Recording started...");
    
  } catch (error) {
    console.error("Error accessing microphone:", error);
    alert("Could not access microphone. Please check permissions.");
    isRecording = false;
  }
}

function stopRecording(cancel = false) {
  if (!isRecording || !mediaRecorder) return;
  
  console.log(cancel ? "Recording cancelled..." : "Recording stopped...");
  
  // Stop timer
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  
  // Store whether to cancel before stopping
  const shouldCancel = cancel;
  
  // Stop media recorder
  if (mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  }
  
  // Stop audio stream
  if (audioStream) {
    audioStream.getTracks().forEach(track => track.stop());
    audioStream = null;
  }
  
  // Reset UI
  inputWrapper.classList.remove("hidden");
  recordingUI.classList.remove("active");
  audioBtn.classList.remove("recording");
  
  isRecording = false;
  
  // Store cancel state for onstop handler
  mediaRecorder._cancelled = shouldCancel;
}

function handleRecordingStop() {
  const duration = Math.floor((Date.now() - recordingStartTime) / 1000);
  
  // Check if recording was cancelled
  if (mediaRecorder._cancelled) {
    console.log("Recording cancelled, not sending");
    audioChunks = [];
    return;
  }
  
  // Create audio blob
  const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
  
  // Minimum recording duration check (0.5 seconds)
  if (duration < 1) {
    console.log("Recording too short");
    addMessage("⚠️ Recording too short. Please hold to record.", "bot");
    audioChunks = [];
    return;
  }
  
  // Add audio message to chat
  addAudioMessage(audioBlob, duration, "user");
  
  // Here you can upload the audio to S3 or send to server
  // uploadAudioToServer(audioBlob);
  
  // Simulate bot response
  setTimeout(() => {
    const botWrapper = document.createElement("div");
    botWrapper.classList.add("message", "bot");
    const botBubble = document.createElement("div");
    botBubble.classList.add("message-content");
    botBubble.innerText = "Thanks for your audio message! 🎤";
    botWrapper.appendChild(botBubble);
    chatBody.appendChild(botWrapper);
    chatBody.scrollTop = chatBody.scrollHeight;
  }, 1000);
  
  audioChunks = [];
}

function updateTimer() {
  if (!recordingStartTime) return;
  
  const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
  recordingTimer.textContent = formatTime(elapsed);
  
  // Auto-stop after 60 seconds (WhatsApp limit)
  if (elapsed >= 60) {
    stopRecording(false);
  }
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/* Optional: Upload audio to server */
async function uploadAudioToServer(audioBlob) {
  try {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    
    // Replace with your actual upload endpoint
    const response = await fetch('/upload-audio', {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Audio uploaded:', data);
    }
  } catch (error) {
    console.error('Error uploading audio:', error);
  }
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  if (isRecording) {
    stopRecording(true);
  }
});
