// Rejestracja Service Worker + aktualizacje
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js').then(registration => {
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // POKAŻ TRWAŁY KOMUNIKAT - NIGDY NIE ZNIKA
          showPersistentUpdateBanner(newWorker);
        }
      });
    });
  });
}

// Funkcja pokazująca PRAWdziwie trwały banner (NIGDY nie znika)
function showPersistentUpdateBanner(newWorker) {
  // Usuń stary banner jeśli istnieje
  const oldBanner = document.getElementById('persistent-update-banner');
  if (oldBanner) oldBanner.remove();
  
  // Stwórz banner
  const banner = document.createElement('div');
  banner.id = 'persistent-update-banner';
  banner.innerHTML = `
    <div class="update-banner-inner">
      <div class="update-banner-icon">🔄</div>
      <div class="update-banner-text">
        <strong>Nowa wersja dostępna!</strong>
        <small>Kliknij przycisk, aby zaktualizować aplikację</small>
      </div>
      <button id="force-update-btn" class="update-banner-btn">AKTUALIZUJ TERAZ</button>
    </div>
  `;
  
  // Style - bardzo agresywne, żeby nikt nie mógł go ukryć
  banner.style.cssText = `
    position: fixed !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%) !important;
    border-top: 3px solid #ff3366 !important;
    padding: 16px 20px !important;
    z-index: 999999 !important;
    box-shadow: 0 -5px 25px rgba(0,0,0,0.5) !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    backdrop-filter: blur(10px) !important;
  `;
  
  // Style dla wewnętrznego kontenera
  const style = document.createElement('style');
  style.textContent = `
    #persistent-update-banner {
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
    }
    .update-banner-inner {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      gap: 15px !important;
      flex-wrap: wrap !important;
      max-width: 600px !important;
      margin: 0 auto !important;
    }
    .update-banner-icon {
      font-size: 32px !important;
      background: #ff3366 !important;
      width: 50px !important;
      height: 50px !important;
      border-radius: 50% !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }
    .update-banner-text {
      flex: 1 !important;
      display: flex !important;
      flex-direction: column !important;
    }
    .update-banner-text strong {
      font-size: 16px !important;
      color: #fff !important;
      margin-bottom: 4px !important;
    }
    .update-banner-text small {
      font-size: 12px !important;
      color: #8888a0 !important;
    }
    .update-banner-btn {
      background: #ff3366 !important;
      color: white !important;
      border: none !important;
      padding: 12px 24px !important;
      border-radius: 30px !important;
      font-weight: bold !important;
      font-size: 14px !important;
      cursor: pointer !important;
      transition: transform 0.2s, background 0.2s !important;
      box-shadow: 0 2px 10px rgba(255,51,102,0.3) !important;
    }
    .update-banner-btn:active {
      transform: scale(0.96) !important;
      background: #e62e5c !important;
    }
    @media (max-width: 550px) {
      .update-banner-inner {
        flex-direction: column !important;
        text-align: center !important;
      }
      .update-banner-btn {
        width: 100% !important;
      }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(banner);
  
  // Obsługa kliknięcia - wymusza aktualizację
  const updateBtn = document.getElementById('force-update-btn');
  if (updateBtn) {
    updateBtn.addEventListener('click', () => {
      // Wyślij komendę do SW
      newWorker.postMessage({ type: 'SKIP_WAITING' });
      // Odśwież stronę
      window.location.reload();
    });
  }
  
  // Dodaj też nasłuchiwanie na cały banner (na wszelki wypadek)
  banner.addEventListener('click', (e) => {
    if (e.target === banner || e.target.classList.contains('update-banner-inner')) {
      // Nie robimy nic - tylko przycisk działa
    }
  });
  
  console.log('Persistent update banner shown - will NOT disappear automatically');
}

// Reszta kodu app.js (reszta BEZ ZMIAN)
const AppState = {
  currentScreen: 'screen-home',
  darkMode: true,
  language: 'pl',
  isWorkoutActive: false
};

// --- INIT ---
document.addEventListener('DOMContentLoaded', async () => {
  loadSettings();

  try {
    await initDB();
    console.log('DB initialized');
  } catch (e) {
    console.error('DB init failed:', e);
    showToast(t('database_error'), 'error');
  }

  applyTheme();
  applyTranslations(AppState.language);

  await renderExercisesList();
  await renderWorkoutsList();
  await renderHistoryList();
  await renderMeasurementsHistory();
  await renderStatsExerciseSelect();
  await renderWorkoutExercisesSelect();

  setupEventListeners();
  showScreen('screen-home', 'GymTracker Pro');

  const msDate = document.getElementById('ms-date');
  if (msDate) msDate.valueAsDate = new Date();
});

// --- SETTINGS ---
function loadSettings() {
  AppState.darkMode = localStorage.getItem('gym-dark') !== 'false';
  AppState.language = localStorage.getItem('gym-lang') || 'pl';

  const darkToggle = document.getElementById('toggle-dark');
  if (darkToggle) darkToggle.checked = AppState.darkMode;

  const langSelect = document.getElementById('lang-select');
  if (langSelect) langSelect.value = AppState.language;
}

function saveSettings() {
  localStorage.setItem('gym-dark', AppState.darkMode);
  localStorage.setItem('gym-lang', AppState.language);
}

function applyTheme() {
  document.documentElement.setAttribute('data-theme', AppState.darkMode ? 'dark' : 'light');
  updateChartTheme();
}

function toggleDarkMode() {
  AppState.darkMode = !AppState.darkMode;
  saveSettings();
  applyTheme();
  showToast(AppState.darkMode ? t('dark_mode') : t('light_mode'), 'info');
}

function changeLanguage(lang) {
  AppState.language = lang;
  saveSettings();
  applyTranslations(lang);
  
  // Odśwież dynamiczne listy
  renderExercisesList();
  renderWorkoutsList();
  renderStatsExerciseSelect();
  renderWorkoutExercisesSelect();
  renderHistoryList();
  renderMeasurementsHistory();
  
  showToast(lang === 'pl' ? 'Polski' : 'English', 'success');
}

// --- EVENT LISTENERS ---
function setupEventListeners() {
  // Menu button - now shows dropdown or just opens settings
  document.getElementById('btn-menu')?.addEventListener('click', () => {
    showScreen('screen-settings', t('settings'));
  });

  // Bottom nav
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const screenId = btn.dataset.screen;
      const titleMap = {
        'screen-home': 'GymTracker Pro',
        'screen-stats': t('statistics'),
        'screen-measurements': t('body_measurements'),
        'screen-history': t('workout_history'),
        'screen-settings': t('settings')
      };
      showScreen(screenId, titleMap[screenId] || 'GymTracker Pro');
    });
  });

 // Back button
document.getElementById('btn-back')?.addEventListener('click', () => {
    if (AppState.isWorkoutActive && activeWorkout) {
        // Tylko wywołanie finishWorkout - on sam pokaże swój modal
        finishWorkout();
        return;
    }

    if (AppState.currentScreen === 'screen-exercise-form' || AppState.currentScreen === 'screen-workout-form') {
        showScreen('screen-home', 'GymTracker Pro');
        return;
    }

    showScreen('screen-home', 'GymTracker Pro');
});

  // New exercise
  document.getElementById('btn-new-exercise')?.addEventListener('click', () => {
    resetExerciseForm();
    showScreen('screen-exercise-form', t('define_exercise'));
  });

  document.getElementById('btn-cancel-exercise')?.addEventListener('click', () => {
    showScreen('screen-home', 'GymTracker Pro');
  });

  // Exercise form submit
  document.getElementById('exercise-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('ex-id').value;
    const exercise = {
      name: document.getElementById('ex-name').value.trim(),
      muscle: document.getElementById('ex-muscle').value,
      weight: parseFloat(document.getElementById('ex-weight').value) || 0,
      reps: parseInt(document.getElementById('ex-reps').value) || 8
    };

    if (!exercise.name) {
      showToast(t('fill_required'), 'error');
      return;
    }

    try {
      if (id) {
        exercise.id = parseInt(id);
        await updateExercise(exercise);
        showToast(t('updated'), 'success');
      } else {
        await addExercise(exercise);
        showToast(t('saved'), 'success');
      }
      await renderExercisesList();
      await renderWorkoutsList();
      showScreen('screen-home', 'GymTracker Pro');
    } catch (err) {
      console.error(err);
      showToast(t('error'), 'error');
    }
  });

  // New workout
  document.getElementById('btn-new-workout')?.addEventListener('click', async () => {
    resetWorkoutForm();
    await renderWorkoutExercisesSelect();
    showScreen('screen-workout-form', t('define_workout'));
  });

  document.getElementById('btn-cancel-workout')?.addEventListener('click', () => {
    showScreen('screen-home', 'GymTracker Pro');
  });

  // Workout form submit
  document.getElementById('workout-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('wo-id').value;
    const name = document.getElementById('wo-name').value.trim();
    const sets = parseInt(document.getElementById('wo-sets').value) || 4;
    const rest = parseInt(document.getElementById('wo-rest').value) || 90;

    const selectedExercises = [];
    document.querySelectorAll('#wo-exercises-select input[type="checkbox"]:checked').forEach(cb => {
      selectedExercises.push(parseInt(cb.value));
    });

    if (!name) {
      showToast(t('fill_required'), 'error');
      return;
    }

    if (selectedExercises.length === 0) {
      showToast(t('no_exercises_selected'), 'error');
      return;
    }

    const workout = { name, sets, rest, exercises: selectedExercises };

    try {
      if (id) {
        workout.id = parseInt(id);
        await updateWorkout(workout);
        showToast(t('updated'), 'success');
      } else {
        await addWorkout(workout);
        showToast(t('saved'), 'success');
      }
      await renderWorkoutsList();
      showScreen('screen-home', 'GymTracker Pro');
    } catch (err) {
      console.error(err);
      showToast(t('error'), 'error');
    }
  });

  // ACTIVE WORKOUT CONTROLS

  // Pause button
  document.getElementById('btn-pause-workout')?.addEventListener('click', () => {
    pauseWorkout();
  });

  // Resume button (on overlay)
  document.getElementById('btn-resume')?.addEventListener('click', () => {
    resumeWorkout();
  });

  // Pause overlay click to resume
  document.getElementById('pause-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'pause-overlay' || e.target.closest('.pause-content')) {
      resumeWorkout();
    }
  });

  // Quick rest +/-
  document.getElementById('btn-rest-minus')?.addEventListener('click', () => {
    adjustQuickRest(-15);
  });

  document.getElementById('btn-rest-plus')?.addEventListener('click', () => {
    adjustQuickRest(15);
  });

  // Rounds +/-
  document.getElementById('btn-rounds-minus')?.addEventListener('click', () => {
    adjustTotalRounds(-1);
  });

  document.getElementById('btn-rounds-plus')?.addEventListener('click', () => {
    adjustTotalRounds(1);
  });

  // Check all
  document.getElementById('check-all-exercises')?.addEventListener('change', (e) => {
    toggleCheckAll(e.target.checked);
  });

  // Complete round button
  document.getElementById('btn-complete-round')?.addEventListener('click', () => {
    completeRound();
  });

  // Finish workout
  document.getElementById('btn-finish-workout')?.addEventListener('click', () => {
    finishWorkout();
  });

  // Stats tabs
  document.querySelectorAll('.stats-tabs .tab-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      document.querySelectorAll('.stats-tabs .tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      await updateStatsChart(btn.dataset.tab);
    });
  });

  document.getElementById('stats-exercise-select')?.addEventListener('change', async () => {
    const activeTab = document.querySelector('.stats-tabs .tab-btn.active');
    if (activeTab) await updateStatsChart(activeTab.dataset.tab);
  });

  // Measurements form
  document.getElementById('measurements-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const measurement = {
      date: document.getElementById('ms-date').value,
      chest: parseFloat(document.getElementById('ms-chest').value) || null,
      bicepsRight: parseFloat(document.getElementById('ms-biceps-right').value) || null,
      bicepsLeft: parseFloat(document.getElementById('ms-biceps-left').value) || null,
      thighRight: parseFloat(document.getElementById('ms-thigh-right').value) || null,
      thighLeft: parseFloat(document.getElementById('ms-thigh-left').value) || null,
      waist: parseFloat(document.getElementById('ms-waist').value) || null
    };

    if (!measurement.date) {
      showToast(t('fill_required'), 'error');
      return;
    }

    try {
      await addMeasurement(measurement);
      showToast(t('saved'), 'success');
      document.getElementById('ms-chest').value = '';
      document.getElementById('ms-biceps-right').value = '';
      document.getElementById('ms-biceps-left').value = '';
      document.getElementById('ms-thigh-right').value = '';
      document.getElementById('ms-thigh-left').value = '';
      document.getElementById('ms-waist').value = '';
      await renderMeasurementsHistory();
    } catch (err) {
      console.error(err);
      showToast(t('error'), 'error');
    }
  });

  // Settings
  document.getElementById('toggle-dark')?.addEventListener('change', (e) => {
    AppState.darkMode = e.target.checked;
    saveSettings();
    applyTheme();
  });

  document.getElementById('lang-select')?.addEventListener('change', (e) => {
    changeLanguage(e.target.value);
  });

  // Export
  document.getElementById('btn-export')?.addEventListener('click', async () => {
    try {
      const data = await exportAllData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gymtracker-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(t('export_success'), 'success');
    } catch (err) {
      console.error(err);
      showToast(t('error'), 'error');
    }
  });

  // Import
  document.getElementById('btn-import')?.addEventListener('click', () => {
    document.getElementById('import-file')?.click();
  });

  document.getElementById('import-file')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      await importAllData(text);
      showToast(t('import_success'), 'success');

      await renderExercisesList();
      await renderWorkoutsList();
      await renderHistoryList();
      await renderMeasurementsHistory();
      await renderStatsExerciseSelect();
      await renderWorkoutExercisesSelect();
    } catch (err) {
      console.error(err);
      showToast(t('import_error'), 'error');
    }
    e.target.value = '';
  });

  // Visibility change
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  });
}

// --- STATS CHART UPDATE ---
async function updateStatsChart(tabType) {
  const exerciseSelect = document.getElementById('stats-exercise-select');
  const exerciseId = exerciseSelect?.value;

  if (tabType === 'weight-chart') {
    if (!exerciseId) {
      renderStatsChart('weight-chart', [], [], t('select_exercise'));
      renderStatsSummary([], 'weight-chart');
      return;
    }
    const stats = await getExerciseStats(parseInt(exerciseId));
    const labels = stats.map(s => s.date.split('T')[0]);
    const data = stats.map(s => ({ maxWeight: s.maxWeight, volume: s.totalVolume }));
    const exercise = await getExercise(parseInt(exerciseId));
    renderStatsChart('weight-chart', data, labels, exercise?.name || t('weight'));
    renderStatsSummary(stats, 'weight-chart');
  } else if (tabType === 'volume-chart') {
    const volumeStats = await getVolumeStats();
    const labels = volumeStats.map(s => s.date);
    const data = volumeStats.map(s => ({ volume: s.volume }));
    renderStatsChart('volume-chart', data, labels, t('volume'));
    renderStatsSummary(volumeStats.map(s => ({ volume: s.volume })), 'volume-chart');
  }
}

// --- OVERRIDE showScreen ---
const originalShowScreen = showScreen;
showScreen = function(screenId, title) {
  AppState.currentScreen = screenId;
  AppState.isWorkoutActive = (screenId === 'screen-active-workout');
  originalShowScreen(screenId, title);
};

// ==========================
// PWA INSTALL PROMPT
// ==========================
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  showInstallButton();
});

function showInstallButton() {
  let btn = document.getElementById('pwa-install-btn');
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'pwa-install-btn';
    btn.textContent = 'Zainstaluj aplikację';
    btn.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:9999;padding:12px 24px;background:#00d4aa;color:#fff;border:none;border-radius:8px;font-size:16px;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.3);display:none;';
    document.body.appendChild(btn);
  }
  btn.style.display = 'block';
  btn.onclick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      deferredPrompt = null;
      btn.style.display = 'none';
    }
  };
}

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  const btn = document.getElementById('pwa-install-btn');
  if (btn) btn.style.display = 'none';
  console.log('Aplikacja zainstalowana');
});
