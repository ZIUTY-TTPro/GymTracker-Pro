let restTimerInterval = null;
let restTimeRemaining = 0;
let restTargetTime = 0;
let restCallback = null;
let lastBeepSecond = -1;

let sessionTimerInterval = null;
let sessionSeconds = 0;
let sessionStartTime = 0;

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

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

function playCountdownBeep(secondsLeft) {
  if (secondsLeft <= 3 && secondsLeft > 0) {
    playBeep(1000, 0.1, 'square');
  } else if (secondsLeft === 0) {
    playBeep(600, 0.4, 'sine');
    setTimeout(() => playBeep(800, 0.4, 'sine'), 200);
  }
}

function playFinishSound() {
  try {
    const ctx = getAudioContext();
    const notes = [523, 659, 784, 1047];
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

// ==========================
// REST TIMER (oparty na Date.now)
// ==========================
function startRestTimer(seconds, onTick, onFinish) {
  if (restTimerInterval) stopRestTimer();

  restTimeRemaining = seconds;
  restTargetTime = Date.now() + seconds * 1000;
  restCallback = onFinish;
  lastBeepSecond = -1;

  if (onTick) onTick(restTimeRemaining);

  restTimerInterval = setInterval(() => {
    const now = Date.now();
    let remaining = Math.round((restTargetTime - now) / 1000);
    if (remaining < 0) remaining = 0;

    if (remaining !== restTimeRemaining) {
      restTimeRemaining = remaining;
      if (onTick) onTick(restTimeRemaining);
    }

    // Dźwięk tylko przy zmianie pełnej sekundy
    if (remaining >= 0 && remaining !== lastBeepSecond) {
      playCountdownBeep(remaining);
      lastBeepSecond = remaining;
    }

    if (remaining <= 0) {
      const cb = restCallback;
      stopRestTimer();
      playFinishSound();
      if (cb) cb();
    }
  }, 500);
}

function stopRestTimer() {
  if (restTimerInterval) {
    clearInterval(restTimerInterval);
    restTimerInterval = null;
  }
  restTimeRemaining = 0;
  restTargetTime = 0;
  restCallback = null;
  lastBeepSecond = -1;
}

function pauseRestTimer() {
  if (restTimerInterval) {
    clearInterval(restTimerInterval);
    restTimerInterval = null;
  }
  // restTimeRemaining zachowuje aktualną pozostałą liczbę sekund
}

function resumeRestTimer(onTick, onFinish) {
  if (restTimeRemaining > 0 && !restTimerInterval) {
    restCallback = onFinish;
    restTargetTime = Date.now() + restTimeRemaining * 1000;
    lastBeepSecond = -1;

    if (onTick) onTick(restTimeRemaining);

    restTimerInterval = setInterval(() => {
      const now = Date.now();
      let remaining = Math.round((restTargetTime - now) / 1000);
      if (remaining < 0) remaining = 0;

      if (remaining !== restTimeRemaining) {
        restTimeRemaining = remaining;
        if (onTick) onTick(restTimeRemaining);
      }

      if (remaining >= 0 && remaining !== lastBeepSecond) {
        playCountdownBeep(remaining);
        lastBeepSecond = remaining;
      }

      if (remaining <= 0) {
        stopRestTimer();
        playFinishSound();
        if (restCallback) restCallback();
      }
    }, 500);
  }
}

function getRestTimeRemaining() {
  return restTimeRemaining;
}

function isRestTimerRunning() {
  return restTimerInterval !== null;
}

// ==========================
// SESSION TIMER (oparty na Date.now)
// ==========================
function startSessionTimer(onTick) {
  stopSessionTimer();
  sessionSeconds = 0;
  sessionStartTime = Date.now();
  if (onTick) onTick(formatTime(0));

  sessionTimerInterval = setInterval(() => {
    sessionSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);
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
    sessionStartTime = Date.now() - sessionSeconds * 1000;
    sessionTimerInterval = setInterval(() => {
      sessionSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);
      if (onTick) onTick(formatTime(sessionSeconds));
    }, 1000);
  }
}

function getSessionSeconds() {
  return sessionSeconds;
}

// ==========================
// FORMATOWANIE
// ==========================
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

// ==========================
// VIBRACJE
// ==========================
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

// Odblokowanie AudioContext po pierwszej interakcji użytkownika (wymagane przez iOS/Chrome Autoplay Policy)
document.body.addEventListener('pointerdown', function unlockAudio() {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume().then(() => {
      console.log('AudioContext odblokowany');
    });
  }
  // Usuwamy nasłuchiwacz po pierwszym uruchomieniu, żeby nie obciążać aplikacji
  document.body.removeEventListener('pointerdown', unlockAudio);
}, { once: true });
