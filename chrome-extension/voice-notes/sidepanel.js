const micBtn = document.getElementById("micBtn");
const statusEl = document.getElementById("status");
const timerEl = document.getElementById("timer");
const interimEl = document.getElementById("interim");
const notesList = document.getElementById("notesList");
const emptyEl = document.getElementById("empty");
const copyBtn = document.getElementById("copyBtn");
const exportBtn = document.getElementById("exportBtn");
const clearBtn = document.getElementById("clearBtn");
const langSelect = document.getElementById("langSelect");

let listening = false;
let recognition = null;
let notes = [];
let lang = "en-US";

// The whole mic-on -> mic-off session is ONE note. Restarts (auto-reconnects)
// append to this same note instead of starting a new one.
let activeNoteIndex = -1;
let sessionBuffer = "";

// Errors that mean retrying won't help until the user acts (permission, hardware).
const FATAL_ERRORS = new Set(["not-allowed", "service-not-allowed", "audio-capture"]);
// Errors that are just the recognizer pausing — safe to auto-restart.
const TRANSIENT_ERRORS = new Set(["no-speech", "aborted", "network"]);

const WATCHDOG_MS = 12000;
const MAX_CONSECUTIVE_RESTARTS = 8;

let restartCount = 0;
let lastActivityAt = 0;
let watchdogTimer = null;
// onend always fires right after onerror — this flag stops it from stomping
// a specific error message with the generic "Click the mic to start" reset.
let suppressNextEndReset = false;

let sessionStartedAt = 0;
let timerInterval = null;

// ---- Storage ----
function loadState() {
  chrome.storage.local.get(["voiceNotes", "voiceNotesLang"], (result) => {
    notes = result.voiceNotes || [];
    lang = result.voiceNotesLang || "en-US";
    langSelect.value = lang;
    renderNotes();
  });
}

function saveNotes() {
  chrome.storage.local.set({ voiceNotes: notes });
}

function beginNoteSession() {
  sessionBuffer = "";
  notes.unshift({ text: "", time: new Date().toLocaleString() });
  activeNoteIndex = 0;
  renderNotes();
}

function appendToActiveNote(transcript) {
  if (!transcript.trim()) return;
  sessionBuffer = sessionBuffer ? `${sessionBuffer} ${transcript.trim()}` : transcript.trim();
  if (activeNoteIndex === -1 || !notes[activeNoteIndex]) {
    notes.unshift({ text: sessionBuffer, time: new Date().toLocaleString() });
    activeNoteIndex = 0;
  } else {
    notes[activeNoteIndex].text = sessionBuffer;
  }
  saveNotes();
  renderNotes();
}

function endNoteSession() {
  // Drop an empty note if the user turned the mic off without saying anything.
  if (activeNoteIndex !== -1 && notes[activeNoteIndex] && !notes[activeNoteIndex].text.trim()) {
    notes.splice(activeNoteIndex, 1);
    saveNotes();
  }
  activeNoteIndex = -1;
  sessionBuffer = "";
  renderNotes();
}

function deleteNote(index) {
  notes.splice(index, 1);
  if (index === activeNoteIndex) activeNoteIndex = -1;
  saveNotes();
  renderNotes();
}

function renderNotes() {
  notesList.innerHTML = "";
  emptyEl.style.display = notes.length ? "none" : "block";
  notes.forEach((note, index) => {
    const div = document.createElement("div");
    div.className = "note" + (index === activeNoteIndex ? " is-active" : "");
    div.innerHTML = `
      <button class="delete" data-index="${index}">✕</button>
      <div class="row">
        <div class="time">${note.time}</div>
        ${index === activeNoteIndex ? '<span class="badge">Recording…</span>' : ""}
      </div>
      <div class="text"></div>
    `;
    div.querySelector(".text").textContent = note.text;
    notesList.appendChild(div);
  });
  notesList.querySelectorAll(".delete").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      deleteNote(parseInt(e.target.dataset.index, 10));
    });
  });
}

// ---- Session timer ----
function formatElapsed(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function startTimer() {
  sessionStartedAt = Date.now();
  timerEl.classList.add("is-active");
  timerEl.textContent = "00:00";
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timerEl.textContent = formatElapsed(Date.now() - sessionStartedAt);
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  timerEl.classList.remove("is-active");
  timerEl.textContent = "";
}

// ---- Speech recognition ----
function getSpeechRecognitionCtor() {
  return window.SpeechRecognition || window.webkitSpeechRecognition;
}

function stopWatchdog() {
  if (watchdogTimer) {
    clearInterval(watchdogTimer);
    watchdogTimer = null;
  }
}

function buildRecognition() {
  const Ctor = getSpeechRecognitionCtor();
  if (!Ctor) return null;

  const rec = new Ctor();
  rec.continuous = true;
  rec.interimResults = true;
  rec.lang = lang;

  rec.onstart = () => {
    lastActivityAt = Date.now();
    if (listening) statusEl.textContent = "Listening… speak now";
  };

  rec.onresult = (event) => {
    lastActivityAt = Date.now();
    restartCount = 0;
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        appendToActiveNote(transcript);
      } else {
        interim += transcript;
      }
    }
    interimEl.textContent = interim;
  };

  rec.onerror = (event) => {
    lastActivityAt = Date.now();
    if (TRANSIENT_ERRORS.has(event.error)) return;

    if (FATAL_ERRORS.has(event.error)) {
      listening = false;
      micBtn.classList.remove("listening");
      stopWatchdog();
      stopTimer();
      suppressNextEndReset = true;
      statusEl.textContent =
        event.error === "not-allowed" || event.error === "service-not-allowed"
          ? "Mic permission denied — allow microphone access and try again."
          : "No microphone found.";
      return;
    }

    console.error("Recognition error:", event.error);
    suppressNextEndReset = true;
    statusEl.textContent = "Error: " + event.error;
  };

  rec.onend = () => {
    if (!listening) {
      // Runs after any trailing final result .stop() flushes, so the note
      // is only finalized here — never synchronously in the click handler.
      endNoteSession();
      interimEl.textContent = "";
      if (suppressNextEndReset) {
        suppressNextEndReset = false;
        return;
      }
      statusEl.textContent = "Click the mic to start";
      return;
    }

    // Auto-restart if the user hasn't manually stopped — this is what keeps
    // noting everything down, as one continuous note, until the mic is off.
    restartCount += 1;
    if (restartCount > MAX_CONSECUTIVE_RESTARTS) {
      listening = false;
      micBtn.classList.remove("listening");
      stopWatchdog();
      stopTimer();
      endNoteSession();
      statusEl.textContent = "Recognition kept failing — click the mic to try again.";
      return;
    }

    statusEl.textContent = "Reconnecting…";
    setTimeout(() => {
      if (!listening || !recognition) return;
      try {
        recognition.start();
      } catch (err) {
        if (err && err.name === "InvalidStateError") return;
        console.error("Restart failed:", err);
      }
    }, 150);
  };

  return rec;
}

function startWatchdog() {
  stopWatchdog();
  watchdogTimer = setInterval(() => {
    if (!listening) return;
    if (Date.now() - lastActivityAt < WATCHDOG_MS) return;
    // No onstart/onresult/onend activity for a while — recognition silently
    // stalled. Force a clean restart rather than looking "on" but dead.
    lastActivityAt = Date.now();
    try {
      recognition && recognition.stop();
    } catch (e) {
      /* ignore */
    }
    recognition = buildRecognition();
    if (recognition) {
      try {
        recognition.start();
        statusEl.textContent = "Reconnecting…";
      } catch (e) {
        /* onend/onerror from the old instance will trigger the normal restart path */
      }
    }
  }, 3000);
}

micBtn.addEventListener("click", () => {
  if (!listening) {
    recognition = buildRecognition();
    if (!recognition) {
      statusEl.textContent = "Speech recognition isn't supported in this browser.";
      micBtn.disabled = true;
      return;
    }

    listening = true;
    restartCount = 0;
    lastActivityAt = Date.now();
    beginNoteSession();
    micBtn.classList.add("listening");
    statusEl.textContent = "Listening… speak now";
    startTimer();
    try {
      recognition.start();
      startWatchdog();
    } catch (err) {
      console.error("Mic start failed:", err);
      statusEl.textContent = "Couldn't start mic: " + err.message;
      listening = false;
      micBtn.classList.remove("listening");
      stopTimer();
      endNoteSession();
    }
  } else {
    listening = false;
    micBtn.classList.remove("listening");
    statusEl.textContent = "Stopped";
    interimEl.textContent = "";
    stopWatchdog();
    stopTimer();
    // Note is finalized in onend, after any trailing final result is flushed
    // by .stop() — finalizing here first could spawn a stray fragment note.
    try {
      recognition.stop();
    } catch (err) {
      console.error("Mic stop failed:", err);
      // .stop() never got to fire onend — finalize now so the note isn't stuck open.
      endNoteSession();
    }
  }
});

langSelect.addEventListener("change", () => {
  lang = langSelect.value;
  chrome.storage.local.set({ voiceNotesLang: lang });
  // Applies to the next recognition session — no need to interrupt a live one.
});

copyBtn.addEventListener("click", async () => {
  if (!notes.length) return;
  try {
    await navigator.clipboard.writeText(notes[0].text);
    const original = copyBtn.textContent;
    copyBtn.textContent = "Copied!";
    setTimeout(() => {
      copyBtn.textContent = original;
    }, 1200);
  } catch (err) {
    console.error("Copy failed:", err);
  }
});

exportBtn.addEventListener("click", () => {
  const text = notes.map((n) => `[${n.time}]\n${n.text}\n`).join("\n");
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "voice-notes.txt";
  a.click();
  URL.revokeObjectURL(url);
});

clearBtn.addEventListener("click", () => {
  if (confirm("Delete all notes? This can't be undone.")) {
    notes = [];
    activeNoteIndex = -1;
    saveNotes();
    renderNotes();
  }
});

loadState();
