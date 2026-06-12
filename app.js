// ============================================
// ZARZĄDZANIE WERSJĄ I AKTUALIZACJAMI
// ============================================

const APP_VERSION = '1.1.0'; // Zwiększaj przy każdej zmianie
let swRegistration = null;
let updateBannerShown = false;

// Rejestracja Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js').then(registration => {
    swRegistration = registration;
    console.log('SW registered:', registration);
    updateSWStatus();
    
    // Sprawdź czy już jest nowy worker czekający
    if (registration.waiting) {
      showUpdateBanner(registration.waiting);
      updateSWStatus();
    }
    
    // Nasłuchuj na nowego workera
    registration.addEventListener('updatefound', () => {
      console.log('Update found!');
      const newWorker = registration.installing;
      updateSWStatus('Pobieranie aktualizacji...');
      
      newWorker.addEventListener('statechange', () => {
        console.log('Worker state:', newWorker.state);
        updateSWStatus(`Stan: ${newWorker.state}`);
        
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          showUpdateBanner(newWorker);
          updateSWStatus('Aktualizacja gotowa!');
        }
      });
    });
  });
  
  // Nasłuchuj na komunikaty
  navigator.serviceWorker.addEventListener('message', (event) => {
    console.log('Message from SW:', event.data);
  });
  
  // Sprawdź przy każdym załadowaniu
  navigator.serviceWorker.ready.then(registration => {
    swRegistration = registration;
    if (registration.waiting) {
      showUpdateBanner(registration.waiting);
    }
    updateSWStatus();
  });
}

// Funkcja aktualizująca status SW w UI
function updateSWStatus(text) {
  const swSpan = document.getElementById('sw-status');
  const versionSpan = document.getElementById('app-version');
  
  if (versionSpan) {
    versionSpan.textContent = `v${APP_VERSION}`;
  }
  
  if (swSpan) {
    if (text) {
      swSpan.textContent = text;
    } else if (swRegistration) {
      if (swRegistration.waiting) {
        swSpan.innerHTML = '<span style="color: #ffb347;">⚠️ Aktualizacja gotowa</span>';
      } else if (swRegistration.active) {
        swSpan.innerHTML = '<span style="color: #00d4aa;">✅ Aktywny</span>';
      } else {
        swSpan.textContent = 'Rejestracja...';
      }
    } else {
      swSpan.textContent = 'Brak Service Worker';
    }
  }
}

// Ręczne sprawdzanie aktualizacji
async function checkForUpdates() {
  if (!swRegistration) {
    showToast('Service Worker nie jest zarejestrowany', 'error');
    return;
  }
  
  showToast('Sprawdzanie aktualizacji...', 'info');
  updateSWStatus('Sprawdzanie...');
  
  try {
    // Wymuś sprawdzenie aktualizacji
    await swRegistration.update();
    
    if (swRegistration.waiting) {
      showUpdateBanner(swRegistration.waiting);
      showToast('Znaleziono aktualizację!', 'success');
      updateSWStatus('Aktualizacja gotowa!');
    } else {
      showToast('Brak nowych aktualizacji', 'info');
      updateSWStatus('✅ Aktualny');
    }
  } catch (err) {
    console.error('Update check failed:', err);
    showToast('Błąd sprawdzania aktualizacji', 'error');
    updateSWStatus('❌ Błąd');
  }
}

// Funkcja pokazująca banner - NIGDY nie znika
function showUpdateBanner(worker) {
  if (updateBannerShown) return;
  updateBannerShown = true;
  
  // Ukryj stary banner jeśli istnieje
  const oldBanner = document.getElementById('update-banner');
  if (oldBanner) oldBanner.remove();
  
  const banner = document.createElement('div');
  banner.id = 'update-banner';
  banner.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
      <span style="font-size: 28px;">🔄</span>
      <div style="flex: 1;">
        <div style="font-weight: bold;">Nowa wersja dostępna!</div>
        <div style="font-size: 12px; opacity: 0.7;">Wersja ${APP_VERSION} → nowsza</div>
      </div>
      <button id="do-update" style="background: #ff3366; color: white; border: none; padding: 10px 20px; border-radius: 30px; font-weight: bold; cursor: pointer;">AKTUALIZUJ TERAZ</button>
      <button id="dismiss-update" style="background: none; color: #888; border: 1px solid #888; padding: 10px 20px; border-radius: 30px; cursor: pointer;">Później</button>
    </div>
  `;
  
  banner.style.cssText = `
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: #1a1a2e;
    border-top: 3px solid #ff3366;
    padding: 15px 20px;
    z-index: 999999;
    box-shadow: 0 -5px 20px rgba(0,0,0,0.3);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    backdrop-filter: blur(10px);
  `;
  
  document.body.appendChild(banner);
  
  document.getElementById('do-update').onclick = () => {
    showToast('Aktualizacja...', 'info');
    worker.postMessage({ type: 'SKIP_WAITING' });
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };
  
  document.getElementById('dismiss-update').onclick = () => {
    banner.remove();
    updateBannerShown = false;
    showToast('Aktualizację można wykonać później w Ustawieniach', 'info');
  };
  
  // Aktualizuj status w ustawieniach
  updateSWStatus('⚠️ Aktualizacja gotowa');
}

// ============================================
// RESZTA ORYGINALNEGO KODU APP.JS
// ============================================

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
  document.getElementById('btn-menu')?.addEventListener('click', () => {
    showScreen('screen-settings', t('settings'));
  });

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

  document.getElementById('btn-back')?.addEventListener('click', () => {
    if (AppState.isWorkoutActive && activeWorkout) {
      finishWorkout();
      return;
    }

    if (AppState.currentScreen === 'screen-exercise-form' || AppState.currentScreen === 'screen-workout-form') {
      showScreen('screen-home', 'GymTracker Pro');
      return;
    }

    showScreen('screen-home', 'GymTracker Pro');
  });

  document.getElementById('btn-new-exercise')?.addEventListener('click', () => {
    resetExerciseForm();
    showScreen('screen-exercise-form', t('define_exercise'));
  });

  document.getElementById('btn-cancel-exercise')?.addEventListener('click', () => {
    showScreen('screen-home', 'GymTracker Pro');
  });

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

  document.getElementById('btn-new-workout')?.addEventListener('click', async () => {
    resetWorkoutForm();
    await renderWorkoutExercisesSelect();
    showScreen('screen-workout-form', t('define_workout'));
  });

  document.getElementById('btn-cancel-workout')?.addEventListener('click', () => {
    showScreen('screen-home', 'GymTracker Pro');
  });

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

  document.getElementById('btn-pause-workout')?.addEventListener('click', () => {
    pauseWorkout();
  });

  document.getElementById('btn-resume')?.addEventListener('click', () => {
    resumeWorkout();
  });

  document.getElementById('pause-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'pause-overlay' || e.target.closest('.pause-content')) {
      resumeWorkout();
    }
  });

  document.getElementById('btn-rest-minus')?.addEventListener('click', () => {
    adjustQuickRest(-15);
  });

  document.getElementById('btn-rest-plus')?.addEventListener('click', () => {
    adjustQuickRest(15);
  });

  document.getElementById('btn-rounds-minus')?.addEventListener('click', () => {
    adjustTotalRounds(-1);
  });

  document.getElementById('btn-rounds-plus')?.addEventListener('click', () => {
    adjustTotalRounds(1);
  });

  document.getElementById('check-all-exercises')?.addEventListener('change', (e) => {
    toggleCheckAll(e.target.checked);
  });

  document.getElementById('btn-complete-round')?.addEventListener('click', () => {
    completeRound();
  });

  document.getElementById('btn-finish-workout')?.addEventListener('click', () => {
    finishWorkout();
  });

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

  document.getElementById('toggle-dark')?.addEventListener('change', (e) => {
    AppState.darkMode = e.target.checked;
    saveSettings();
    applyTheme();
  });

  document.getElementById('lang-select')?.addEventListener('change', (e) => {
    changeLanguage(e.target.value);
  });

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

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  });

  // Przycisk sprawdzania aktualizacji
  document.getElementById('check-updates-btn')?.addEventListener('click', () => {
    checkForUpdates();
  });
}

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

const originalShowScreen = showScreen;
showScreen = function(screenId, title) {
  AppState.currentScreen = screenId;
  AppState.isWorkoutActive = (screenId === 'screen-active-workout');
  originalShowScreen(screenId, title);
};

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
