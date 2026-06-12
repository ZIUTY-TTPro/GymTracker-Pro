// Rejestracja Service Worker + aktualizacje
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js').then(registration => {
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // POKAŻ TRWAŁY KOMUNIKAT Z PRZYCISKIEM
          showUpdateNotification(newWorker);
        }
      });
    });
  });
}

// Funkcja pokazująca trwały komunikat aktualizacji
function showUpdateNotification(newWorker) {
  // Sprawdź czy już istnieje taki komunikat
  if (document.getElementById('update-banner')) return;
  
  // Stwórz banner
  const banner = document.createElement('div');
  banner.id = 'update-banner';
  banner.innerHTML = `
    <div class="update-banner-content">
      <span class="update-icon">🔄</span>
      <span class="update-text">Dostępna jest nowa wersja aplikacji!</span>
      <button id="update-now-btn" class="update-btn">AKTUALIZUJ</button>
    </div>
  `;
  banner.style.cssText = `
    position: fixed;
    bottom: 80px;
    left: 16px;
    right: 16px;
    background: var(--surface);
    border: 2px solid var(--primary);
    border-radius: var(--radius);
    padding: 16px;
    z-index: 10000;
    box-shadow: var(--shadow);
    animation: slideUp 0.3s ease;
  `;
  
  // Dodaj style dla animacji
  if (!document.querySelector('#update-banner-styles')) {
    const style = document.createElement('style');
    style.id = 'update-banner-styles';
    style.textContent = `
      @keyframes slideUp {
        from { transform: translateY(100px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      .update-banner-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
      }
      .update-icon {
        font-size: 24px;
      }
      .update-text {
        flex: 1;
        font-weight: 600;
        color: var(--text);
      }
      .update-btn {
        background: var(--primary);
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: var(--radius-sm);
        font-weight: 700;
        cursor: pointer;
        transition: transform 0.2s;
      }
      .update-btn:active {
        transform: scale(0.97);
      }
      @media (max-width: 480px) {
        .update-banner-content {
          flex-direction: column;
          text-align: center;
        }
        .update-btn {
          width: 100%;
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(banner);
  
  // Obsługa kliknięcia przycisku
  document.getElementById('update-now-btn').addEventListener('click', () => {
    newWorker.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  });
}

// Reszta kodu app.js pozostaje BEZ ZMIAN (poniżej)
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
