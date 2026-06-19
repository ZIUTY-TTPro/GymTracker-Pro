// ============================================
// SPRAWDZANIE CZY DZIAŁAMY LOKALNIE
// ============================================
const isLocalFile = window.location.protocol === 'file:';

if (isLocalFile) {
  console.log('⚠️ Uruchomiono lokalnie (file://) - Service Worker wyłączony');
  setTimeout(() => {
    if (typeof showToast === 'function') {
      showToast(t('app_offline_mode'), 'info');
    }
  }, 1000);
}

// ============================================
// ZARZĄDZANIE WERSJĄ I AKTUALIZACJAMI
// ============================================

const APP_VERSION = '1.1.0';
let swRegistration = null;
let updateBannerShown = false;

if ('serviceWorker' in navigator && !isLocalFile) {
  navigator.serviceWorker.register('./service-worker.js').then(registration => {
    swRegistration = registration;
    console.log('SW registered:', registration);
    updateSWStatus();
    
    if (registration.waiting) {
      showUpdateBanner(registration.waiting);
      updateSWStatus();
    }
    
    registration.addEventListener('updatefound', () => {
      console.log('Update found!');
      const newWorker = registration.installing;
      updateSWStatus(t('sw_downloading'));
      
      newWorker.addEventListener('statechange', () => {
        console.log('Worker state:', newWorker.state);
        updateSWStatus(t('sw_state', null, newWorker.state));
        
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          showUpdateBanner(newWorker);
          updateSWStatus(t('sw_update_ready'));
        }
      });
    });
  });
  
  navigator.serviceWorker.addEventListener('message', (event) => {
    console.log('Message from SW:', event.data);
  });
  
  navigator.serviceWorker.ready.then(registration => {
    swRegistration = registration;
    if (registration.waiting) {
      showUpdateBanner(registration.waiting);
    }
    updateSWStatus();
  });
} else if ('serviceWorker' in navigator && isLocalFile) {
  console.log('SW nie został zarejestrowany - lokalny plik (file://)');
  setTimeout(() => {
    const swSpan = document.getElementById('sw-status');
    if (swSpan) {
      swSpan.innerHTML = `<span style="color: #ffb347;">⚠️ ${t('sw_unavailable_offline')}</span>`;
    }
  }, 500);
}

function updateSWStatus(text) {
  const swSpan = document.getElementById('sw-status');
  const versionSpan = document.getElementById('app-version');
  
  if (versionSpan) {
    versionSpan.textContent = `v${APP_VERSION}`;
  }
  
  if (swSpan) {
    if (isLocalFile) {
      swSpan.innerHTML = `<span style="color: #ffb347;">⚠️ ${t('sw_unavailable_offline')}</span>`;
      return;
    }
    
    if (text) {
      swSpan.textContent = text;
    } else if (swRegistration) {
      if (swRegistration.waiting) {
        swSpan.innerHTML = `<span style="color: #ffb347;">⚠️ ${t('sw_update_ready')}</span>`;
      } else if (swRegistration.active) {
        swSpan.innerHTML = `<span style="color: #00d4aa;">✅ ${t('sw_active')}</span>`;
      } else {
        swSpan.textContent = t('sw_registration');
      }
    } else {
      swSpan.textContent = t('sw_none');
    }
  }
}

async function checkForUpdates() {
  if (isLocalFile) {
    showToast(t('updates_only_online'), 'info');
    return;
  }
  
  if (!swRegistration) {
    showToast(t('sw_not_registered'), 'error');
    return;
  }
  
  showToast(t('sw_checking_updates'), 'info');
  updateSWStatus(t('sw_checking_updates'));
  
  try {
    await swRegistration.update();
    
    if (swRegistration.waiting) {
      showUpdateBanner(swRegistration.waiting);
      showToast(t('update_found'), 'success');
      updateSWStatus(t('sw_update_ready'));
    } else {
      showToast(t('no_updates'), 'info');
      updateSWStatus(t('sw_up_to_date'));
    }
  } catch (err) {
    console.error('Update check failed:', err);
    showToast(t('update_check_error'), 'error');
    updateSWStatus(t('sw_error'));
  }
}

function showUpdateBanner(worker) {
  if (updateBannerShown) return;
  updateBannerShown = true;
  
  const oldBanner = document.getElementById('update-banner');
  if (oldBanner) oldBanner.remove();
  
  const banner = document.createElement('div');
  banner.id = 'update-banner';
  banner.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
      <span style="font-size: 28px;">🔄</span>
      <div style="flex: 1;">
        <div style="font-weight: bold;">${t('update_available')}</div>
        <div style="font-size: 12px; opacity: 0.7;">${t('version_x_to_newer', null, APP_VERSION)}</div>
      </div>
      <button id="do-update" style="background: #ff3366; color: white; border: none; padding: 10px 20px; border-radius: 30px; font-weight: bold; cursor: pointer;">${t('update_now')}</button>
      <button id="dismiss-update" style="background: none; color: #888; border: 1px solid #888; padding: 10px 20px; border-radius: 30px; cursor: pointer;">${t('later')}</button>
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
    showToast(t('updating'), 'info');
    worker.postMessage({ type: 'SKIP_WAITING' });
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };
  
  document.getElementById('dismiss-update').onclick = () => {
    banner.remove();
    updateBannerShown = false;
    showToast(t('update_can_be_done_later'), 'info');
  };
  
  updateSWStatus(t('sw_update_ready'));
}

// ============================================
// APP STATE
// ============================================

const AppState = {
  currentScreen: 'screen-home',
  darkMode: true,
  language: 'pl',
  isWorkoutActive: false
};

const originalShowScreen = window.showScreen || function(screenId, title) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const screen = document.getElementById(screenId);
  if (screen) screen.classList.add('active');
  const pageTitle = document.getElementById('page-title');
  if (pageTitle && title) pageTitle.textContent = title;
};

window.showScreen = function(screenId, title) {
  AppState.currentScreen = screenId;
  AppState.isWorkoutActive = (screenId === 'screen-active-workout');
  originalShowScreen(screenId, title);
  
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.screen === screenId);
  });
  
  const bottomNav = document.getElementById('bottom-nav');
  const hideNavScreens = ['screen-exercise-form', 'screen-workout-form', 'screen-active-workout', 'screen-activity-workout'];
  if (bottomNav) bottomNav.classList.toggle('hidden', hideNavScreens.includes(screenId));
  
  const backBtn = document.getElementById('btn-back');
  if (backBtn) {
    backBtn.classList.toggle('hidden', !hideNavScreens.includes(screenId) && screenId !== 'screen-home');
  }
  
  const main = document.getElementById('main');
  if (main) main.scrollTop = 0;

  if (screenId === 'screen-stats') {
    const activeTab = document.querySelector('.stats-tabs .tab-btn.active');
    const isActivityTab = activeTab && activeTab.dataset.tab === 'activity-stats';
    
    if (!isActivityTab) {
      renderStatsExerciseSelect().then(() => {
        const activeTab2 = document.querySelector('.stats-tabs .tab-btn.active');
        if (activeTab2) {
          const tab = activeTab2.dataset.tab;
          if (typeof switchStatsTab === 'function') {
            switchStatsTab(tab);
          }
        }
      }).catch(e => console.error('Stats error:', e));
    } else {
      if (typeof switchStatsTab === 'function') {
        switchStatsTab('activity-stats');
      }
    }
  }

  if (screenId === 'screen-history') {
    renderHistoryList().catch(e => console.error('History error:', e));
  }
  
  try {
    localStorage.setItem('gym-current-screen', screenId);
  } catch(e) { /* ignore */ }
};

// ============================================
// INIT
// ============================================

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

  try {
    await renderExercisesList();
  } catch (e) { console.error('renderExercisesList error:', e); }
  
  try {
    await renderWorkoutsList();
  } catch (e) { console.error('renderWorkoutsList error:', e); }
  
  try {
    await renderHistoryList();
  } catch (e) { console.error('renderHistoryList error:', e); }
  
  try {
    await renderMeasurementsHistory();
  } catch (e) { console.error('renderMeasurementsHistory error:', e); }
  
  try {
    await renderStatsExerciseSelect();
  } catch (e) { console.error('renderStatsExerciseSelect error:', e); }
  
  try {
    await renderWorkoutExercisesSelect();
  } catch (e) { console.error('renderWorkoutExercisesSelect error:', e); }
  
  try {
    await renderWorkoutActivitySelect();
  } catch (e) { console.error('renderWorkoutActivitySelect error:', e); }

  // NIE ustawiamy żadnego ćwiczenia – czekamy na wybór użytkownika
  const statsSelect = document.getElementById('stats-exercise-select');
  if (statsSelect) {
    statsSelect.value = '';
  }

  setupEventListeners();
  
  const lastScreen = localStorage.getItem('gym-current-screen') || 'screen-home';
  const titleMap = {
    'screen-home': 'GymTracker Pro',
    'screen-stats': t('statistics'),
    'screen-measurements': t('body_measurements'),
    'screen-history': t('workout_history'),
    'screen-settings': t('settings')
  };
  showScreen(lastScreen, titleMap[lastScreen] || 'GymTracker Pro');

  const msDate = document.getElementById('ms-date');
  if (msDate) msDate.valueAsDate = new Date();

  const saved = localStorage.getItem('gym-autosave');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000 && data.activeWorkout) {
        const confirmRestore = confirm('Odnaleziono niezakończony trening. Kontynuować?');
        if (confirmRestore) {
          if (window.WorkoutState) {
            window.WorkoutState.restore(data);
          }
          if (typeof renderActiveWorkout === 'function') renderActiveWorkout();
          showScreen('screen-active-workout', window.WorkoutState.activeWorkout.workoutName);
          if (window.WorkoutState.isWaitingForRest && window.WorkoutState.savedRestSeconds > 0) {
            const restCountdown = document.getElementById('rest-countdown');
            const restSecondsEl = document.getElementById('rest-seconds');
            const restTimerEl = document.getElementById('rest-timer');
            if (restCountdown) restCountdown.classList.add('active');
            if (restSecondsEl) restSecondsEl.textContent = window.WorkoutState.savedRestSeconds;
            if (restTimerEl) restTimerEl.textContent = formatRestTime(window.WorkoutState.savedRestSeconds);
            startRestTimer(window.WorkoutState.savedRestSeconds, (remaining) => {
              if (!window.WorkoutState.isPaused) {
                if (restSecondsEl) restSecondsEl.textContent = remaining;
                if (restTimerEl) restTimerEl.textContent = formatRestTime(remaining);
              }
            }, () => {
              window.WorkoutState.isWaitingForRest = false;
              if (restCountdown) restCountdown.classList.remove('active');
              if (restTimerEl) restTimerEl.textContent = '--:--';
              vibrateRestDone();
              if (typeof renderActiveWorkout === 'function') renderActiveWorkout();
            });
          }
        }
      }
    } catch(e) { console.warn('Auto-restore failed', e); }
  }
  
  if (typeof initExercisesToggle === 'function') {
    initExercisesToggle();
  }
  
  if (typeof renderActivityStats === 'function') {
    const activeTab = document.querySelector('.stats-tabs .tab-btn.active');
    if (activeTab && activeTab.dataset.tab === 'activity-stats') {
      renderActivityStats();
    }
  }
});

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
  if (typeof updateChartTheme === 'function') updateChartTheme();
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
  
  const hint = document.getElementById('wo-activity-hint');
  if (hint && document.getElementById('wo-type-select')?.value === 'activity') {
    hint.innerHTML = t('select_one_activity');
  }
  
  Promise.all([
    renderExercisesList(),
    renderWorkoutsList(),
    renderStatsExerciseSelect(),
    renderWorkoutExercisesSelect(),
    renderWorkoutActivitySelect(),
    renderHistoryList(),
    renderMeasurementsHistory()
  ]).catch(e => console.error('Change language error:', e));
  
  const activeTab = document.querySelector('.stats-tabs .tab-btn.active');
  if (activeTab && activeTab.dataset.tab === 'activity-stats') {
    if (typeof renderActivityStats === 'function') renderActivityStats();
  }
  
  showToast(lang === 'pl' ? t('polish') : t('english'), 'success');
}

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
    if (AppState.isWorkoutActive && window.WorkoutState && window.WorkoutState.activeWorkout) {
      if (typeof finishWorkout === 'function') finishWorkout();
      return;
    }
    if (AppState.currentScreen === 'screen-exercise-form' || AppState.currentScreen === 'screen-workout-form') {
      showScreen('screen-home', 'GymTracker Pro');
      return;
    }
    if (AppState.currentScreen === 'screen-activity-workout') {
      if (typeof cancelActivity === 'function') cancelActivity();
      return;
    }
    showScreen('screen-home', 'GymTracker Pro');
  });

  document.getElementById('btn-new-exercise')?.addEventListener('click', () => {
    if (typeof resetExerciseForm === 'function') resetExerciseForm();
    showScreen('screen-exercise-form', t('define_exercise'));
  });

  document.getElementById('btn-cancel-exercise')?.addEventListener('click', () => {
    showScreen('screen-home', 'GymTracker Pro');
  });

  const exTypeSelect = document.getElementById('ex-type');
  if (exTypeSelect) {
    exTypeSelect.addEventListener('change', () => {
      const isActivity = exTypeSelect.value === 'activity';
      const isStrength = exTypeSelect.value === 'strength';
      document.getElementById('ex-strength-fields').style.display = isStrength ? 'block' : 'none';
      document.getElementById('ex-activity-fields').style.display = isActivity ? 'block' : 'none';
      const nameInput = document.getElementById('ex-name');
      if (nameInput) {
        nameInput.placeholder = isActivity ? t('activity_placeholder') : t('exercise_placeholder');
      }
    });
  }

  document.getElementById('exercise-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('ex-id').value;
    const type = document.getElementById('ex-type').value;
    
    if (!type) {
      showToast('Wybierz typ ćwiczenia', 'error');
      return;
    }
    
    const exercise = {
      name: document.getElementById('ex-name').value.trim(),
      type: type
    };

    if (type === 'strength') {
      exercise.muscle = document.getElementById('ex-muscle').value;
      exercise.weight = parseFloat(document.getElementById('ex-weight').value) || 0;
      exercise.reps = parseInt(document.getElementById('ex-reps').value) || 8;
      exercise.measureDuration = false;
      exercise.note = '';
    } else {
      exercise.muscle = 'Aktywność ogólna';
      exercise.weight = 0;
      exercise.reps = 0;
      exercise.measureDuration = document.getElementById('ex-measure-duration').checked;
      exercise.note = document.getElementById('ex-activity-note').value.trim();
    }

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
      await Promise.all([
        renderExercisesList(),
        renderWorkoutsList(),
        renderStatsExerciseSelect(),
        renderWorkoutActivitySelect()
      ]);
      showScreen('screen-home', 'GymTracker Pro');
    } catch (err) {
      console.error(err);
      showToast(t('error'), 'error');
    }
  });

  document.getElementById('btn-new-workout')?.addEventListener('click', async () => {
    if (typeof resetWorkoutForm === 'function') resetWorkoutForm();
    try {
      await renderWorkoutExercisesSelect();
      await renderWorkoutActivitySelect();
    } catch (e) {
      console.error('Error rendering selects:', e);
    }
    showScreen('screen-workout-form', t('define_workout'));
  });

  document.getElementById('btn-cancel-workout')?.addEventListener('click', () => {
    showScreen('screen-home', 'GymTracker Pro');
  });

  document.getElementById('workout-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('wo-id').value;
    const type = document.getElementById('wo-type').value;
    
    if (!type) {
      showToast('Wybierz typ treningu', 'error');
      return;
    }
    const name = document.getElementById('wo-name').value.trim();
    
    let selectedExercises = [];
    let workout = { name, type };

    if (type === 'activity') {
      document.querySelectorAll('#wo-activity-select input[type="checkbox"]:checked').forEach(cb => {
        selectedExercises.push(parseInt(cb.value));
      });
      workout.sets = 1;
      workout.rest = 0;
    } else {
      const sets = parseInt(document.getElementById('wo-sets').value) || 4;
      const rest = parseInt(document.getElementById('wo-rest').value) || 90;
      document.querySelectorAll('#wo-exercises-select input[type="checkbox"]:checked').forEach(cb => {
        selectedExercises.push(parseInt(cb.value));
      });
      workout.sets = sets;
      workout.rest = rest;
    }

    if (!name) {
      showToast(t('fill_required'), 'error');
      return;
    }
    if (selectedExercises.length === 0) {
      showToast(t('no_exercises_selected'), 'error');
      return;
    }

    workout.exercises = selectedExercises;

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
  
// ---- PRZYCISK START/STOP STOPERA ----
document.getElementById('btn-start-timer')?.addEventListener('click', () => {
  if (typeof toggleActivityTimer === 'function') toggleActivityTimer();
});

  const woTypeSelect = document.getElementById('wo-type-select');
  if (woTypeSelect) {
    woTypeSelect.addEventListener('change', () => {
      const isActivity = woTypeSelect.value === 'activity';
      const isStrength = woTypeSelect.value === 'strength';
      
      document.getElementById('wo-strength-fields').style.display = isStrength ? 'block' : 'none';
      
      document.getElementById('wo-exercises-select').style.display = isStrength ? 'block' : 'none';
      document.getElementById('wo-activity-select').style.display = isActivity ? 'block' : 'none';
      
      const hint = document.getElementById('wo-activity-hint');
      if (hint) {
        hint.style.display = isActivity ? 'block' : 'none';
        if (isActivity) {
          hint.innerHTML = t('select_one_activity');
        }
      }
      
      document.getElementById('wo-type').value = woTypeSelect.value || '';
      
      const nameInput = document.getElementById('wo-name');
      if (nameInput) {
        if (isActivity) nameInput.placeholder = t('activity_placeholder');
        else if (isStrength) nameInput.placeholder = t('workout_placeholder');
        else nameInput.placeholder = t('workout_placeholder');
      }
    });
    woTypeSelect.dispatchEvent(new Event('change'));
  }

  document.getElementById('btn-finish-activity')?.addEventListener('click', () => {
    if (typeof finishActivity === 'function') finishActivity();
  });

  document.getElementById('btn-cancel-activity')?.addEventListener('click', () => {
    if (typeof cancelActivity === 'function') cancelActivity();
  });

  document.getElementById('btn-pause-workout')?.addEventListener('click', () => {
    if (typeof pauseWorkout === 'function') pauseWorkout();
  });

  document.getElementById('btn-resume')?.addEventListener('click', () => {
    if (typeof resumeWorkout === 'function') resumeWorkout();
  });

  document.getElementById('pause-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'pause-overlay' || e.target.closest('.pause-content')) {
      if (typeof resumeWorkout === 'function') resumeWorkout();
    }
  });

  document.getElementById('btn-rest-minus')?.addEventListener('click', () => {
    if (typeof adjustQuickRest === 'function') adjustQuickRest(-15);
  });

  document.getElementById('btn-rest-plus')?.addEventListener('click', () => {
    if (typeof adjustQuickRest === 'function') adjustQuickRest(15);
  });

  document.getElementById('btn-rounds-minus')?.addEventListener('click', () => {
    if (typeof adjustTotalRounds === 'function') adjustTotalRounds(-1);
  });

  document.getElementById('btn-rounds-plus')?.addEventListener('click', () => {
    if (typeof adjustTotalRounds === 'function') adjustTotalRounds(1);
  });

  document.getElementById('check-all-exercises')?.addEventListener('change', (e) => {
    if (typeof toggleCheckAll === 'function') toggleCheckAll(e.target.checked);
  });

  document.getElementById('btn-complete-round')?.addEventListener('click', () => {
    if (typeof completeRound === 'function') completeRound();
  });

  document.getElementById('btn-finish-workout')?.addEventListener('click', () => {
    if (typeof finishWorkout === 'function') finishWorkout();
  });

  document.querySelectorAll('.stats-tabs .tab-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      document.querySelectorAll('.stats-tabs .tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      
      if (typeof switchStatsTab === 'function') {
        switchStatsTab(tab);
      }
      
      if (tab !== 'activity-stats') {
        const select = document.getElementById('stats-exercise-select');
        if (select && select.value && select.value !== '') {
          if (typeof updateStatsChart === 'function') {
            try {
              await updateStatsChart(tab);
            } catch (e) { console.error('Stats chart error:', e); }
          }
        }
      }
    });
  });

  document.getElementById('stats-exercise-select')?.addEventListener('change', async () => {
    const select = document.getElementById('stats-exercise-select');
    const exerciseId = select?.value;
    
    if (!exerciseId || exerciseId === '') {
      if (typeof renderStatsChart === 'function') {
        renderStatsChart('weight-chart', [], [], t('select_exercise'));
      }
      if (typeof renderStatsSummary === 'function') {
        renderStatsSummary([], 'weight-chart');
      }
      return;
    }
    
    const activeTab = document.querySelector('.stats-tabs .tab-btn.active');
    if (activeTab && activeTab.dataset.tab !== 'activity-stats') {
      if (typeof updateStatsChart === 'function') {
        try {
          await updateStatsChart(activeTab.dataset.tab);
        } catch (e) { console.error('Stats chart error:', e); }
      }
    }
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
      if (typeof renderMeasurementsHistory === 'function') await renderMeasurementsHistory();
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
    const btn = document.getElementById('btn-export');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = '⏳ Eksportowanie...';
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
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  });

  document.getElementById('btn-import')?.addEventListener('click', () => {
    document.getElementById('import-file')?.click();
  });

  document.getElementById('import-file')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const btn = document.getElementById('btn-import');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = '⏳ Importowanie...';
    try {
      const text = await file.text();
      
      let parsedData;
      try {
        parsedData = JSON.parse(text);
      } catch (err) {
        throw new Error(t('import_error_json_format'));
      }
      
      if (!parsedData || typeof parsedData !== 'object' || (!parsedData.exercises && !parsedData.workouts)) {
        throw new Error(t('import_error_invalid_data'));
      }

      await importAllData(text);
      showToast(t('import_success'), 'success');
      await Promise.all([
        renderExercisesList(),
        renderWorkoutsList(),
        renderHistoryList(),
        renderMeasurementsHistory(),
        renderStatsExerciseSelect(),
        renderWorkoutExercisesSelect(),
        renderWorkoutActivitySelect()
      ]);
    } catch (err) {
      console.error(err);
      const msg = (err.message.includes(t('import_error_json_format')) || err.message.includes(t('import_error_invalid_data'))) ? err.message : t('import_error');
      showToast(msg, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
    e.target.value = '';
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && typeof audioCtx !== 'undefined' && audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  });

  document.getElementById('check-updates-btn')?.addEventListener('click', () => {
    checkForUpdates();
  });
}

async function updateStatsChart(tabType) {
  const exerciseSelect = document.getElementById('stats-exercise-select');
  const exerciseId = exerciseSelect ? exerciseSelect.value : '';

  if (tabType === 'weight-chart') {
    if (!exerciseId || exerciseId === '') {
      if (typeof renderStatsChart === 'function') renderStatsChart('weight-chart', [], [], t('select_exercise'));
      if (typeof renderStatsSummary === 'function') renderStatsSummary([], 'weight-chart');
      return;
    }
    const stats = await getExerciseStats(parseInt(exerciseId));
    const labels = stats.map(s => s.date.split('T')[0]);
    const data = stats.map(s => ({ weight: s.maxWeight }));
    const exercise = await getExercise(parseInt(exerciseId));
    if (typeof renderStatsChart === 'function') renderStatsChart('weight-chart', data, labels, exercise?.name || t('max_weight'));
    if (typeof renderStatsSummary === 'function') renderStatsSummary(stats, 'weight-chart');

  } else if (tabType === 'volume-chart') {
    // Sprawdzamy czy wybrano ćwiczenie - jeśli nie, czyścimy wykres i podsumowanie
    if (!exerciseId || exerciseId === '') {
      if (typeof renderStatsChart === 'function') renderStatsChart('volume-chart', [], [], t('select_exercise'));
      if (typeof renderStatsSummary === 'function') renderStatsSummary([], 'volume-chart');
      return;
    }
    
    // Pobieramy statystyki dla konkretnego ćwiczenia
    const volumeStats = await getExerciseStats(parseInt(exerciseId)); 
    const labels = volumeStats.map(s => s.date.split('T')[0]);
    // Mapujemy dane na obiekt z kluczem 'volume', którego oczekuje Chart.js w ui.js
    const data = volumeStats.map(s => ({ volume: s.totalVolume }));
    const exercise = await getExercise(parseInt(exerciseId));
    
    if (typeof renderStatsChart === 'function') {
      renderStatsChart('volume-chart', data, labels, exercise?.name || t('volume'));
    }
    
    if (typeof renderStatsSummary === 'function') {
      // Przekazujemy przemapowane dane, aby renderStatsSummary poprawnie wyliczyło średnie i maksima
      const summaryData = volumeStats.map(s => ({
        maxWeight: s.maxWeight,
        weight: s.maxWeight, 
        volume: s.totalVolume
      }));
      renderStatsSummary(summaryData, 'volume-chart');
    }
  }
}

window.addEventListener('beforeunload', (e) => {
  if (window.WorkoutState && window.WorkoutState.activeWorkout && !window.WorkoutState.isPaused) {
    e.preventDefault();
    e.returnValue = '';
  }
});

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
    btn.textContent = t('install_app');
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
