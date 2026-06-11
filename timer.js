let restTimerInterval = null;
let restTimeRemaining = 0;
let restCallback = null;
let sessionTimerInterval = null;
let sessionSeconds = 0;

// --- AUDIO CONTEXT (Web Audio API) ---
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

// Play beep sound
function playBeep(frequency = 800, duration = 0.15, type = 'sine') {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn('Audio beep failed:', e);
  }
}

// Play countdown beeps (3 short beeps + 1 long)
function playCountdownBeep(secondsLeft) {
  if (secondsLeft <= 3 && secondsLeft > 0) {
    playBeep(1000, 0.1, 'square');
  } else if (secondsLeft === 0) {
    playBeep(600, 0.4, 'sine');
    setTimeout(() => playBeep(800, 0.4, 'sine'), 200);
  }
}

// Play finish sound
function playFinishSound() {
  try {
    const ctx = getAudioContext();
    const notes = [523, 659, 784, 1047]; // C E G C
    notes.forEach((freq, i) => {
      setTimeout(() => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      }, i * 150);
    });
  } catch (e) {
    console.warn('Finish sound failed:', e);
  }
}

// --- REST TIMER ---
function startRestTimer(seconds, onTick, onFinish) {
  stopRestTimer();
  restTimeRemaining = seconds;
  restCallback = onFinish;

  if (onTick) onTick(restTimeRemaining);

  restTimerInterval = setInterval(() => {
    restTimeRemaining--;

    playCountdownBeep(restTimeRemaining);

    if (onTick) onTick(restTimeRemaining);

    if (restTimeRemaining <= 0) {
      const cb = restCallback;
      stopRestTimer();
      playFinishSound();
      if (cb) cb();
    }
  }, 1000);
}

function stopRestTimer() {
  if (restTimerInterval) {
    clearInterval(restTimerInterval);
    restTimerInterval = null;
  }
  restTimeRemaining = 0;
  restCallback = null;
}

function pauseRestTimer() {
  if (restTimerInterval) {
    clearInterval(restTimerInterval);
    restTimerInterval = null;
  }
}

function resumeRestTimer(onTick, onFinish) {
  if (restTimeRemaining > 0 && !restTimerInterval) {
    restCallback = onFinish;
    restTimerInterval = setInterval(() => {
      restTimeRemaining--;
      playCountdownBeep(restTimeRemaining);
      if (onTick) onTick(restTimeRemaining);
      if (restTimeRemaining <= 0) {
        stopRestTimer();
        playFinishSound();
        if (restCallback) restCallback();
      }
    }, 1000);
  }
}

function getRestTimeRemaining() {
  return restTimeRemaining;
}

function isRestTimerRunning() {
  return restTimerInterval !== null;
}

// --- SESSION TIMER ---
function startSessionTimer(onTick) {
  stopSessionTimer();
  sessionSeconds = 0;

  if (onTick) onTick(formatTime(sessionSeconds));

  sessionTimerInterval = setInterval(() => {
    sessionSeconds++;
    if (onTick) onTick(formatTime(sessionSeconds));
  }, 1000);
}

function stopSessionTimer() {
  if (sessionTimerInterval) {
    clearInterval(sessionTimerInterval);
    sessionTimerInterval = null;
  }
  sessionSeconds = 0;
}

function pauseSessionTimer() {
  if (sessionTimerInterval) {
    clearInterval(sessionTimerInterval);
    sessionTimerInterval = null;
  }
}

function resumeSessionTimer(onTick) {
  if (!sessionTimerInterval) {
    sessionTimerInterval = setInterval(() => {
      sessionSeconds++;
      if (onTick) onTick(formatTime(sessionSeconds));
    }, 1000);
  }
}

function getSessionSeconds() {
  return sessionSeconds;
}

// --- UTILS ---
function formatTime(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatRestTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// --- VIBRATION ---
function vibrate(pattern) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

function vibrateShort() {
  vibrate(50);
}

function vibrateRestDone() {
  vibrate([100, 50, 100]);
}

function vibrateSetComplete() {
  vibrate([30]);
}
