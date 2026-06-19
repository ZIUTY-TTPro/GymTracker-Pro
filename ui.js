function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// --- TOASTS ---
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success: '✓', error: '✕', info: 'ⓘ' };
  toast.innerHTML = `<span>${icons[type] || 'ⓘ'}</span> ${message}`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// --- SCREEN NAVIGATION ---
function showScreen(screenId, title = null) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const screen = document.getElementById(screenId);
  if (screen) screen.classList.add('active');

  const pageTitle = document.getElementById('page-title');
  if (pageTitle && title) pageTitle.textContent = title;

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

  if (screenId === 'screen-history') {
    renderHistoryList();
  }
}

// --- EXERCISES LIST ---
async function renderExercisesList() {
  const container = document.getElementById('exercises-list');
  if (!container) return;
  const exercises = await getAllExercises();
  container.innerHTML = '';

  if (exercises.length === 0) {
    container.innerHTML = '<div class="card"><div class="card-info"><p>' + t('no_data') + '</p></div></div>';
    return;
  }

  exercises.forEach(ex => {
    const card = document.createElement('div');
    card.className = 'card';
    const isActivity = ex.type === 'activity';
    const icon = isActivity ? '🏃 ' : '';
    const details = isActivity 
      ? (ex.note ? '📝 ' + escapeHtml(ex.note) : t('activity'))
      : `${escapeHtml(t(MUSCLE_GROUP_MAP[ex.muscle]) || ex.muscle)} • ${ex.weight || 0}kg • ${ex.reps || 8} ${t('reps').toLowerCase()}`;
    
    card.innerHTML = `
      <div class="card-info">
        <h3>${icon}${escapeHtml(ex.name)}</h3>
        <p>${details}</p>
      </div>
      <div class="card-actions">
        <button class="card-btn edit" data-id="${ex.id}" title="${t('edit')}">✎</button>
        <button class="card-btn delete" data-id="${ex.id}" title="${t('delete')}">🗑</button>
      </div>
    `;
    card.querySelector('.edit').addEventListener('click', (e) => { e.stopPropagation(); editExercise(ex.id); });
    card.querySelector('.delete').addEventListener('click', (e) => { e.stopPropagation(); deleteExerciseItem(ex.id); });
    container.appendChild(card);
  });
}

// --- WORKOUTS LIST ---
async function renderWorkoutsList() {
  const container = document.getElementById('workouts-list');
  if (!container) return;
  const workouts = await getAllWorkouts();
  container.innerHTML = '';

  if (workouts.length === 0) {
    container.innerHTML = '<div class="card"><div class="card-info"><p>' + t('no_data') + '</p></div></div>';
    return;
  }

  workouts.forEach(wo => {
    const isActivity = wo.type === 'activity';
    const exCount = wo.exercises ? wo.exercises.length : 0;
    const icon = isActivity ? '🏃 ' : '';
    const details = isActivity 
      ? `${t('activity')}`
      : `${exCount} ${t('exercise').toLowerCase()} • ${wo.sets || 4} ${t('sets').toLowerCase()} • ${wo.rest || 90}s ${t('rest_timer').toLowerCase()}`;
    
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-info">
        <h3>${icon}${escapeHtml(wo.name)}</h3>
        <p>${details}</p>
      </div>
      <div class="card-actions">
        <button class="card-btn play" data-id="${wo.id}" title="${t('start')}">▶</button>
        <button class="card-btn edit" data-id="${wo.id}" title="${t('edit')}">✎</button>
        <button class="card-btn delete" data-id="${wo.id}" title="${t('delete')}">🗑</button>
      </div>
    `;
    card.querySelector('.play').addEventListener('click', (e) => { e.stopPropagation(); startWorkout(wo.id); });
    card.querySelector('.edit').addEventListener('click', (e) => { e.stopPropagation(); editWorkout(wo.id); });
    card.querySelector('.delete').addEventListener('click', (e) => { e.stopPropagation(); deleteWorkoutItem(wo.id); });
    container.appendChild(card);
  });
}

// --- EXERCISE FORM ---
function editExercise(id) {
  getExercise(id).then(ex => {
    if (!ex) return;
    document.getElementById('ex-id').value = ex.id;
    document.getElementById('ex-name').value = ex.name || '';
    document.getElementById('ex-type').value = ex.type || 'strength';
    
    if (ex.type === 'activity') {
      document.getElementById('ex-strength-fields').style.display = 'none';
      document.getElementById('ex-activity-fields').style.display = 'block';
      document.getElementById('ex-measure-duration').checked = ex.measureDuration !== false;
      document.getElementById('ex-activity-note').value = ex.note || '';
    } else {
      document.getElementById('ex-strength-fields').style.display = 'block';
      document.getElementById('ex-activity-fields').style.display = 'none';
      document.getElementById('ex-muscle').value = ex.muscle || 'Klatka piersiowa';
      document.getElementById('ex-weight').value = ex.weight || 20;
      document.getElementById('ex-reps').value = ex.reps || 8;
    }
    showScreen('screen-exercise-form', t('define_exercise'));
  });
}

function resetExerciseForm() {
  document.getElementById('exercise-form').reset();
  document.getElementById('ex-id').value = '';
  document.getElementById('ex-type').value = '';
  document.getElementById('ex-muscle').value = '';
  document.getElementById('ex-strength-fields').style.display = 'block';
  document.getElementById('ex-activity-fields').style.display = 'none';
  document.getElementById('ex-weight').value = 20;
  document.getElementById('ex-reps').value = 8;
  document.getElementById('ex-measure-duration').checked = true;
  document.getElementById('ex-activity-note').value = '';
}

async function deleteExerciseItem(id) {
  if (!confirm(t('confirm_delete'))) return;
  try {
    await deleteExercise(id);
    showToast(t('deleted'), 'success');
    renderExercisesList();
    renderWorkoutsList();
    renderStatsExerciseSelect();
  } catch (e) { showToast(t('error'), 'error'); }
}

// --- WORKOUT FORM ---
async function renderWorkoutExercisesSelect() {
  const container = document.getElementById('wo-exercises-select');
  if (!container) return;
  const exercises = await getAllExercises();
  const strengthExercises = exercises.filter(ex => ex.type !== 'activity');
  container.innerHTML = '';

  if (strengthExercises.length === 0) {
    container.innerHTML = '<p style="padding:14px;color:var(--text-secondary);">' + t('no_data_add_exercise') + '</p>';
    return;
  }

  strengthExercises.forEach(ex => {
    const item = document.createElement('div');
    item.className = 'exercise-select-item';
    
    item.innerHTML = `
      <div class="ex-info">
        <h4>${escapeHtml(ex.name)}</h4>
        <p>${escapeHtml(t(MUSCLE_GROUP_MAP[ex.muscle]) || ex.muscle)} • ${ex.weight}kg • ${ex.reps} ${t('reps').toLowerCase()}</p>
      </div>
      <div class="check-circle"></div>
      <input type="checkbox" value="${ex.id}" data-name="${escapeHtml(ex.name)}">
    `;
    
    const checkbox = item.querySelector('input[type="checkbox"]');
    const checkCircle = item.querySelector('.check-circle');
    
    checkCircle.addEventListener('click', (e) => {
      e.stopPropagation();
      checkbox.checked = !checkbox.checked;
      item.classList.toggle('selected', checkbox.checked);
    });
    
    container.appendChild(item);
  });
}

async function renderWorkoutActivitySelect() {
  const container = document.getElementById('wo-activity-select');
  if (!container) return;
  const exercises = await getAllExercises();
  const activities = exercises.filter(ex => ex.type === 'activity');
  container.innerHTML = '';

  if (activities.length === 0) {
    container.innerHTML = '<p style="padding:14px;color:var(--text-secondary);">' + t('no_data_add_exercise') + '</p>';
    return;
  }

  activities.forEach(ex => {
    const item = document.createElement('div');
    item.className = 'exercise-select-item';
    
    item.innerHTML = `
      <div class="ex-info">
        <h4>🏃 ${escapeHtml(ex.name)}</h4>
        <p>${ex.note ? '📝 ' + escapeHtml(ex.note) : ''}</p>
      </div>
      <div class="check-circle"></div>
      <input type="checkbox" value="${ex.id}" data-name="${escapeHtml(ex.name)}">
    `;
    
    const checkbox = item.querySelector('input[type="checkbox"]');
    const checkCircle = item.querySelector('.check-circle');
    
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        document.querySelectorAll('#wo-activity-select input[type="checkbox"]').forEach(cb => {
          if (cb !== checkbox) cb.checked = false;
        });
        document.querySelectorAll('#wo-activity-select .exercise-select-item').forEach(el => {
          el.classList.toggle('selected', el.querySelector('input').checked);
        });
      }
    });
    
    checkCircle.addEventListener('click', (e) => {
      e.stopPropagation();
      checkbox.checked = !checkbox.checked;
      if (checkbox.checked) {
        document.querySelectorAll('#wo-activity-select input[type="checkbox"]').forEach(cb => {
          if (cb !== checkbox) cb.checked = false;
        });
      }
      document.querySelectorAll('#wo-activity-select .exercise-select-item').forEach(el => {
        el.classList.toggle('selected', el.querySelector('input').checked);
      });
    });
    
    container.appendChild(item);
  });
}

function editWorkout(id) {
  getWorkout(id).then(wo => {
    if (!wo) return;
    document.getElementById('wo-id').value = wo.id;
    document.getElementById('wo-name').value = wo.name || '';
    document.getElementById('wo-type').value = wo.type || 'strength';
    
    const typeSelect = document.getElementById('wo-type-select');
    if (typeSelect) typeSelect.value = wo.type || 'strength';
    
    const isActivity = wo.type === 'activity';
    
    document.getElementById('wo-strength-fields').style.display = isActivity ? 'none' : 'block';
    
    const hint = document.getElementById('wo-activity-hint');
    if (hint) {
      hint.style.display = isActivity ? 'block' : 'none';
      if (isActivity) {
        hint.innerHTML = t('select_one_activity');
      }
    }
    
    document.getElementById('wo-exercises-select').style.display = isActivity ? 'none' : 'block';
    document.getElementById('wo-activity-select').style.display = isActivity ? 'block' : 'none';
    
    if (isActivity) {
      renderWorkoutActivitySelect().then(() => {
        if (wo.exercises && wo.exercises.length > 0) {
          document.querySelectorAll('#wo-activity-select input[type="checkbox"]').forEach(cb => {
            const val = parseInt(cb.value);
            const isSelected = wo.exercises.includes(val);
            cb.checked = isSelected;
            cb.closest('.exercise-select-item').classList.toggle('selected', isSelected);
          });
        }
        showScreen('screen-workout-form', t('define_workout'));
      });
    } else {
      document.getElementById('wo-sets').value = wo.sets || 4;
      document.getElementById('wo-rest').value = wo.rest || 90;
      renderWorkoutExercisesSelect().then(() => {
        if (wo.exercises) {
          document.querySelectorAll('#wo-exercises-select input[type="checkbox"]').forEach(cb => {
            const val = parseInt(cb.value);
            const isSelected = wo.exercises.includes(val);
            cb.checked = isSelected;
            cb.closest('.exercise-select-item').classList.toggle('selected', isSelected);
          });
        }
        showScreen('screen-workout-form', t('define_workout'));
      });
    }
  });
}

function resetWorkoutForm() {
  document.getElementById('workout-form').reset();
  document.getElementById('wo-id').value = '';
  document.getElementById('wo-type').value = '';
  const typeSelect = document.getElementById('wo-type-select');
  if (typeSelect) typeSelect.value = '';
  document.getElementById('wo-sets').value = 4;
  document.getElementById('wo-rest').value = 90;
  document.getElementById('wo-strength-fields').style.display = 'block';
  document.getElementById('wo-exercises-select').style.display = 'block';
  document.getElementById('wo-activity-select').style.display = 'none';
  document.getElementById('wo-activity-hint').style.display = 'none';
  document.querySelectorAll('#wo-exercises-select .exercise-select-item').forEach(item => {
    item.classList.remove('selected');
    item.querySelector('input').checked = false;
  });
  document.querySelectorAll('#wo-activity-select .exercise-select-item').forEach(item => {
    item.classList.remove('selected');
    item.querySelector('input').checked = false;
  });
}

async function deleteWorkoutItem(id) {
  if (!confirm(t('confirm_delete'))) return;
  try {
    await deleteWorkout(id);
    showToast(t('deleted'), 'success');
    renderWorkoutsList();
  } catch (e) { showToast(t('error'), 'error'); }
}

// ============================================
// ACTIVE WORKOUT - CENTRALNY STAN
// ============================================

window.WorkoutState = {
  activeWorkout: null,
  currentRound: 0,
  isPaused: false,
  savedRestSeconds: 0,
  isWaitingForRest: false,
  isLastRoundReady: false,

  reset() {
    this.activeWorkout = null;
    this.currentRound = 0;
    this.isPaused = false;
    this.savedRestSeconds = 0;
    this.isWaitingForRest = false;
    this.isLastRoundReady = false;
  },

  save() {
    if (!this.activeWorkout) {
      localStorage.removeItem('gym-autosave');
      return;
    }
    localStorage.setItem('gym-autosave', JSON.stringify({
      activeWorkout: this.activeWorkout,
      currentRound: this.currentRound,
      isWaitingForRest: this.isWaitingForRest,
      savedRestSeconds: typeof getRestTimeRemaining === 'function' ? getRestTimeRemaining() : this.savedRestSeconds,
      isLastRoundReady: this.isLastRoundReady,
      timestamp: Date.now()
    }));
  },

  restore(savedData) {
    this.activeWorkout = savedData.activeWorkout || null;
    this.currentRound = savedData.currentRound || 0;
    this.isWaitingForRest = savedData.isWaitingForRest || false;
    this.savedRestSeconds = savedData.savedRestSeconds || 0;
    this.isLastRoundReady = savedData.isLastRoundReady || false;
    this.isPaused = false;

    if (this.isLastRoundReady) {
      const finishBtn = document.getElementById('btn-finish-workout');
      if (finishBtn) {
        finishBtn.classList.add('ready-to-finish');
        finishBtn.style.background = 'var(--success)';
        finishBtn.style.border = '2px solid var(--success)';
        finishBtn.style.color = '#000';
        finishBtn.style.fontWeight = '700';
      }
    }
  }
};

// ============================================
// AKTYWNOŚCI OGÓLNE - STAN
// ============================================

window.ActivityState = {
  activeActivity: null,
  startTime: null,
  timerInterval: null,
  seconds: 0
};

window.ActivityTimerState = {
  isRunning: false,
  isPaused: false
};

function resetActivityState() {
  window.ActivityState.activeActivity = null;
  window.ActivityState.startTime = null;
  if (window.ActivityState.timerInterval) {
    clearInterval(window.ActivityState.timerInterval);
    window.ActivityState.timerInterval = null;
  }
  window.ActivityState.seconds = 0;
}

// ============================================
// LOGIKA AKTYWNOŚCI
// ============================================

async function startActivity(workoutId) {
  const workout = await getWorkout(workoutId);
  if (!workout || !workout.exercises || workout.exercises.length === 0) {
    showToast(t('no_exercises_selected'), 'error');
    return;
  }

  const exercise = await getExercise(workout.exercises[0]);
  if (!exercise) {
    showToast(t('error'), 'error');
    return;
  }

  resetActivityState();
  resetActivityTimer();

  window.ActivityState.activeActivity = {
    workoutId: workout.id,
    workoutName: workout.name,
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    measureDuration: exercise.measureDuration !== false,
    note: '',
    startTime: null
  };

  document.getElementById('activity-name').textContent = exercise.name;
  document.getElementById('activity-timer').textContent = '0:00';
  document.getElementById('activity-note-input').value = '';

  const btn = document.getElementById('btn-start-timer');
  if (btn) {
    btn.textContent = t('start_timer');
    btn.style.background = '';
    btn.style.display = 'block';
  }

  showScreen('screen-activity-workout', exercise.name);
  showToast(t('activity_started'), 'success');

  document.getElementById('activity-note-input').addEventListener('input', (e) => {
    if (window.ActivityState.activeActivity) {
      window.ActivityState.activeActivity.note = e.target.value;
    }
  });
}

function startActivityTimer() {
  window.ActivityState.startTime = Date.now();
  window.ActivityState.seconds = 0;

  if (window.ActivityState.timerInterval) {
    clearInterval(window.ActivityState.timerInterval);
  }

  window.ActivityState.timerInterval = setInterval(() => {
    window.ActivityState.seconds = Math.floor((Date.now() - window.ActivityState.startTime) / 1000);
    const timerEl = document.getElementById('activity-timer');
    if (timerEl) {
      timerEl.textContent = formatTime(window.ActivityState.seconds);
    }
  }, 1000);
}

function stopActivityTimer() {
  if (window.ActivityState.timerInterval) {
    clearInterval(window.ActivityState.timerInterval);
    window.ActivityState.timerInterval = null;
  }
}

async function finishActivity() {
  if (!window.ActivityState.activeActivity) return;

  const confirmed = await showConfirmModal({
    title: '🏃 ' + t('finish_activity'),
    message: ''
  });

  if (!confirmed) return;

  stopActivityTimer();

  const session = {
    workoutId: window.ActivityState.activeActivity.workoutId,
    workoutName: window.ActivityState.activeActivity.workoutName,
    type: 'activity',
    startTime: window.ActivityState.activeActivity.startTime || new Date().toISOString(),
    endTime: new Date().toISOString(),
    duration: window.ActivityState.seconds || 0,
    date: new Date().toLocaleDateString('fr-CA'),
    exercises: [{
      exerciseId: window.ActivityState.activeActivity.exerciseId,
      name: window.ActivityState.activeActivity.exerciseName,
      type: 'activity',
      duration: window.ActivityState.seconds || 0,
      note: window.ActivityState.activeActivity.note || '',
      completed: true
    }]
  };

  try {
    await addSession(session);
    showToast(t('activity_completed'), 'success');
    playFinishSound();
  } catch (e) {
    showToast(t('error'), 'error');
  }

  resetActivityState();
  resetActivityTimer();
  renderWorkoutsList();
  renderHistoryList();
  showScreen('screen-home', 'GymTracker Pro');
}

function cancelActivity() {
  if (!window.ActivityState.activeActivity) return;

  const confirmed = confirm(t('confirm_delete'));
  if (!confirmed) return;

  stopActivityTimer();
  resetActivityTimer();
  resetActivityState();
  showScreen('screen-home', 'GymTracker Pro');
}

// ============================================
// STEROWANIE STOPEREM AKTYWNOŚCI
// ============================================
function toggleActivityTimer() {
  const btn = document.getElementById('btn-start-timer');
  if (!btn) return;
  
  if (window.ActivityState.timerInterval) {
    stopActivityTimer();
    btn.textContent = t('resume_timer');
    btn.style.background = 'var(--success)';
  } else {
    startActivityTimer();
    btn.textContent = t('stop_timer');
    btn.style.background = 'var(--danger)';
  }
}

function resetActivityTimer() {
  stopActivityTimer();
  window.ActivityState.seconds = 0;
  window.ActivityState.startTime = null;
  const timerEl = document.getElementById('activity-timer');
  if (timerEl) timerEl.textContent = '0:00';
  const btn = document.getElementById('btn-start-timer');
  if (btn) {
    btn.textContent = t('start_timer');
    btn.style.background = '';
  }
}

// ============================================
// LOGIKA AKTYWNEGO TRENINGU SIŁOWEGO
// ============================================

async function startWorkout(workoutId) {
  const workout = await getWorkout(workoutId);
  if (!workout || !workout.exercises || workout.exercises.length === 0) {
    showToast(t('no_exercises_selected'), 'error');
    return;
  }

  const firstExercise = await getExercise(workout.exercises[0]);
  if (firstExercise && firstExercise.type === 'activity') {
    startActivity(workoutId);
    return;
  }

  const exercises = await getAllExercises();
  const missing = workout.exercises.some(exId => !exercises.find(e => e.id === exId));
  if (missing) {
    showToast(t('some_exercises_missing'), 'error');
    return;
  }

  const workoutExercises = [];

  for (const exId of workout.exercises) {
    const ex = exercises.find(e => e.id === exId || e.id === parseInt(exId));
    if (ex) {
      workoutExercises.push({
        exerciseId: ex.id,
        name: ex.name,
        muscle: ex.muscle,
        defaultWeight: ex.weight || 0,
        defaultReps: ex.reps || 8,
        rounds: Array.from({ length: workout.sets || 4 }, (_, i) => ({
          roundNum: i + 1,
          weight: ex.weight || 0,
          reps: ex.reps || 8,
          completed: false
        }))
      });
    }
  }

  window.WorkoutState.reset();
  window.WorkoutState.activeWorkout = {
    workoutId: workout.id,
    workoutName: workout.name,
    totalSets: workout.sets || 4,
    restSeconds: workout.rest || 90,
    exercises: workoutExercises,
    startTime: new Date().toISOString()
  };

  const pauseOverlay = document.getElementById('pause-overlay');
  if (pauseOverlay) pauseOverlay.classList.add('hidden');

  const quickRest = document.getElementById('quick-rest');
  if (quickRest) quickRest.value = window.WorkoutState.activeWorkout.restSeconds;

  const checkAll = document.getElementById('check-all-exercises');
  if (checkAll) checkAll.checked = false;

  const finishBtn = document.getElementById('btn-finish-workout');
  if (finishBtn) {
    finishBtn.classList.remove('ready-to-finish');
    finishBtn.style.background = '';
    finishBtn.style.border = '';
  }

  startSessionTimer(time => {
    if (!window.WorkoutState.isPaused) {
      const timerEl = document.getElementById('session-timer');
      if (timerEl) timerEl.textContent = time;
    }
  });

  renderActiveWorkout();
  showScreen('screen-active-workout', workout.name);
  showToast(t('workout_started'), 'success');

  window.WorkoutState.save();
}

function renderActiveWorkout() {
  if (!window.WorkoutState.activeWorkout) return;

  const currentRoundSpan = document.getElementById('current-round');
  const totalRoundsSpan = document.getElementById('total-rounds');

  if (currentRoundSpan) currentRoundSpan.textContent = window.WorkoutState.currentRound + 1;
  if (totalRoundsSpan) totalRoundsSpan.textContent = window.WorkoutState.activeWorkout.totalSets;

  const tbody = document.getElementById('superset-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  window.WorkoutState.activeWorkout.exercises.forEach((ex, exIndex) => {
    const round = ex.rounds[window.WorkoutState.currentRound];
    const isDone = round.completed;

    const tr = document.createElement('tr');
    if (isDone) tr.classList.add('ex-done');

    tr.innerHTML = `
      <td>${escapeHtml(ex.name)}</td>
      <td><input type="number" id="w-${exIndex}_${window.WorkoutState.currentRound}" value="${round.weight}" step="0.5" min="0"></td>
      <td><input type="number" id="r-${exIndex}_${window.WorkoutState.currentRound}" value="${round.reps}" min="1" max="100"></td>
      <td class="check-cell">
        <button class="check-btn ${isDone ? 'checked' : ''}" data-ex="${exIndex}" data-round="${window.WorkoutState.currentRound}">
          ${isDone ? '✓' : ''}
        </button>
      </td>
    `;

    const checkBtn = tr.querySelector('.check-btn');
    checkBtn.addEventListener('click', () => {
      if (window.WorkoutState.isPaused) {
        showToast(t('resume_to_continue'), 'info');
        return;
      }
      if (window.WorkoutState.isWaitingForRest) {
        showToast(t('wait_for_rest'), 'info');
        return;
      }
      round.completed = !round.completed;
      if (round.completed) {
        const wInput = document.getElementById(`w-${exIndex}_${window.WorkoutState.currentRound}`);
        const rInput = document.getElementById(`r-${exIndex}_${window.WorkoutState.currentRound}`);
        round.weight = wInput ? (parseFloat(wInput.value) || ex.defaultWeight) : ex.defaultWeight;
        round.reps = rInput ? (parseInt(rInput.value) || ex.defaultReps) : ex.defaultReps;
        vibrateShort();
      }
      renderActiveWorkout();
      updateCompleteButton();
      window.WorkoutState.save();
    });

    tbody.appendChild(tr);
  });

  const checkAll = document.getElementById('check-all-exercises');
  if (checkAll) {
    const allChecked = window.WorkoutState.activeWorkout.exercises.every(ex => ex.rounds[window.WorkoutState.currentRound].completed);
    checkAll.checked = allChecked;
  }

  const restCountdown = document.getElementById('rest-countdown');
  if (restCountdown && !window.WorkoutState.isWaitingForRest) restCountdown.classList.remove('active');

  const restTimerEl = document.getElementById('rest-timer');
  if (restTimerEl && !window.WorkoutState.isWaitingForRest) restTimerEl.textContent = '--:--';

  updateCompleteButton();
}

function updateCompleteButton() {
  const btn = document.getElementById('btn-complete-round');
  if (!btn || !window.WorkoutState.activeWorkout) return;

  btn.disabled = false;

  const doneCount = window.WorkoutState.activeWorkout.exercises.filter(ex => ex.rounds[window.WorkoutState.currentRound].completed).length;
  const total = window.WorkoutState.activeWorkout.exercises.length;
  const isLastRound = (window.WorkoutState.currentRound + 1 === window.WorkoutState.activeWorkout.totalSets);

  if (doneCount === total) {
    if (isLastRound) {
      btn.innerHTML = `<span>✓ ${t('complete_workout')} ✓</span>`;
    } else {
      btn.innerHTML = `<span>✓ ${t('complete_round')} ✓</span>`;
    }
  } else {
    if (isLastRound) {
      btn.innerHTML = `<span>${t('done_count_finish_workout', null, doneCount, total)}</span>`;
    } else {
      btn.innerHTML = `<span>${t('done_count_finish_round', null, doneCount, total)}</span>`;
    }
  }
}

function toggleCheckAll(checked) {
  if (!window.WorkoutState.activeWorkout) return;

  if (window.WorkoutState.isPaused) {
    showToast(t('resume_to_continue'), 'info');
    const checkAll = document.getElementById('check-all-exercises');
    if (checkAll) checkAll.checked = !checked;
    return;
  }

  if (window.WorkoutState.isWaitingForRest) {
    showToast(t('wait_for_rest'), 'info');
    const checkAll = document.getElementById('check-all-exercises');
    if (checkAll) checkAll.checked = !checked;
    return;
  }

  window.WorkoutState.activeWorkout.exercises.forEach((ex, i) => {
    const round = ex.rounds[window.WorkoutState.currentRound];
    round.completed = checked;
    if (checked) {
      const wInput = document.getElementById(`w-${i}_${window.WorkoutState.currentRound}`);
      const rInput = document.getElementById(`r-${i}_${window.WorkoutState.currentRound}`);
      round.weight = wInput ? (parseFloat(wInput.value) || ex.defaultWeight) : ex.defaultWeight;
      round.reps = rInput ? (parseInt(rInput.value) || ex.defaultReps) : ex.defaultReps;
    }
  });
  if (checked) vibrateShort();
  renderActiveWorkout();
  updateCompleteButton();
  window.WorkoutState.save();
}

function completeRound() {
  if (!window.WorkoutState.activeWorkout || window.WorkoutState.isPaused) return;

  if (window.WorkoutState.isWaitingForRest) {
    showToast(t('rest_in_progress'), 'info');
    return;
  }

  window.WorkoutState.activeWorkout.exercises.forEach((ex, i) => {
    const round = ex.rounds[window.WorkoutState.currentRound];
    const wInput = document.getElementById(`w-${i}_${window.WorkoutState.currentRound}`);
    const rInput = document.getElementById(`r-${i}_${window.WorkoutState.currentRound}`);
    if (wInput) round.weight = parseFloat(wInput.value) || ex.defaultWeight;
    if (rInput) round.reps = parseInt(rInput.value) || ex.defaultReps;
  });

  const isLastRound = (window.WorkoutState.currentRound + 1 === window.WorkoutState.activeWorkout.totalSets);

  if (isLastRound) {
    const allCompleted = window.WorkoutState.activeWorkout.exercises.every(ex => ex.rounds[window.WorkoutState.currentRound].completed);

    if (allCompleted) {
      const finishBtn = document.getElementById('btn-finish-workout');
      if (finishBtn) {
        finishBtn.classList.add('ready-to-finish');
        finishBtn.style.background = 'var(--success)';
        finishBtn.style.border = '2px solid var(--success)';
        finishBtn.style.color = '#000';
        finishBtn.style.fontWeight = '700';
      }
      window.WorkoutState.isLastRoundReady = true;
      window.WorkoutState.save();
      showToast(t('click_finish_to_save'), 'success');
    } else {
      showToast(t('check_all_exercises_to_finish'), 'info');
    }
    return;
  }

  window.WorkoutState.currentRound++;
  const prevRound = window.WorkoutState.currentRound - 1;
  const currentRoundData = window.WorkoutState.currentRound;

  window.WorkoutState.activeWorkout.exercises.forEach((ex, i) => {
    const prevRoundCompleted = ex.rounds[prevRound].completed;
    const currentRoundCompleted = ex.rounds[currentRoundData].completed;

    if (currentRoundCompleted === false && prevRoundCompleted === true) {
      ex.rounds[currentRoundData].completed = true;
      ex.rounds[currentRoundData].weight = ex.rounds[prevRound].weight;
      ex.rounds[currentRoundData].reps = ex.rounds[prevRound].reps;
    }
  });

  window.WorkoutState.isWaitingForRest = true;

  const quickRest = document.getElementById('quick-rest');
  const restSeconds = quickRest ? (parseInt(quickRest.value) || window.WorkoutState.activeWorkout.restSeconds) : window.WorkoutState.activeWorkout.restSeconds;

  const restCountdown = document.getElementById('rest-countdown');
  const restSecondsEl = document.getElementById('rest-seconds');
  const restTimerEl = document.getElementById('rest-timer');

  if (restCountdown) restCountdown.classList.add('active');
  if (restSecondsEl) restSecondsEl.textContent = restSeconds;
  if (restTimerEl) restTimerEl.textContent = formatRestTime(restSeconds);

  startRestTimer(restSeconds, (remaining) => {
    if (!window.WorkoutState.isPaused) {
      if (restSecondsEl) restSecondsEl.textContent = remaining;
      if (restTimerEl) restTimerEl.textContent = formatRestTime(remaining);
    }
  }, () => {
    window.WorkoutState.isWaitingForRest = false;

    if (restCountdown) restCountdown.classList.remove('active');
    if (restTimerEl) restTimerEl.textContent = '--:--';

    vibrateRestDone();
    showToast(t('round_x_of_y', null, window.WorkoutState.currentRound + 1, window.WorkoutState.activeWorkout.totalSets), 'success');

    renderActiveWorkout();
    vibrateSetComplete();
    window.WorkoutState.save();
  });

  showToast(t('rest_x_next_round_y', null, restSeconds, window.WorkoutState.currentRound + 1), 'info');
}

function pauseWorkout() {
  if (!window.WorkoutState.activeWorkout) return;
  window.WorkoutState.isPaused = true;
  pauseSessionTimer();
  window.WorkoutState.savedRestSeconds = getRestTimeRemaining();
  pauseRestTimer();

  const pauseOverlay = document.getElementById('pause-overlay');
  if (pauseOverlay) pauseOverlay.classList.remove('hidden');

  window.WorkoutState.save();
  showToast(t('workout_paused'), 'info');
}

function resumeWorkout() {
  if (!window.WorkoutState.activeWorkout) return;
  window.WorkoutState.isPaused = false;

  const pauseOverlay = document.getElementById('pause-overlay');
  if (pauseOverlay) pauseOverlay.classList.add('hidden');

  resumeSessionTimer(time => {
    const timerEl = document.getElementById('session-timer');
    if (timerEl) timerEl.textContent = time;
  });

  if (window.WorkoutState.savedRestSeconds > 0 && window.WorkoutState.isWaitingForRest) {
    const restCountdown = document.getElementById('rest-countdown');
    const restSecondsEl = document.getElementById('rest-seconds');
    const restTimerEl = document.getElementById('rest-timer');

    if (restCountdown) restCountdown.classList.add('active');

    startRestTimer(window.WorkoutState.savedRestSeconds, (remaining) => {
      if (restSecondsEl) restSecondsEl.textContent = remaining;
      if (restTimerEl) restTimerEl.textContent = formatRestTime(remaining);
    }, () => {
      window.WorkoutState.isWaitingForRest = false;
      if (restCountdown) restCountdown.classList.remove('active');
      if (restTimerEl) restTimerEl.textContent = '--:--';
      vibrateRestDone();
      showToast(t('round_x_of_y', null, window.WorkoutState.currentRound + 1, window.WorkoutState.activeWorkout.totalSets), 'success');
      renderActiveWorkout();
    });

    window.WorkoutState.savedRestSeconds = 0;
  }

  window.WorkoutState.save();
  showToast(t('resume_workout'), 'success');
}

function adjustQuickRest(delta) {
  if (window.WorkoutState.isWaitingForRest) {
    showToast(t('cannot_change_rest'), 'info');
    return;
  }
  if (window.WorkoutState.isPaused) {
    showToast(t('resume_to_continue'), 'info');
    return;
  }
  const input = document.getElementById('quick-rest');
  if (!input) return;
  let val = parseInt(input.value) || 90;
  val += delta;
  if (val < 0) val = 0;
  if (val > 600) val = 600;
  input.value = val;
  if (window.WorkoutState.activeWorkout) window.WorkoutState.activeWorkout.restSeconds = val;
  window.WorkoutState.save();
}

function adjustTotalRounds(delta) {
  if (!window.WorkoutState.activeWorkout) return;

  if (window.WorkoutState.isWaitingForRest) {
    showToast(t('cannot_change_rounds'), 'info');
    return;
  }
  if (window.WorkoutState.isPaused) {
    showToast(t('resume_to_continue'), 'info');
    return;
  }

  let newTotal = window.WorkoutState.activeWorkout.totalSets + delta;
  if (newTotal < 1) newTotal = 1;
  if (newTotal > 20) newTotal = 20;

  if (newTotal === window.WorkoutState.activeWorkout.totalSets) return;

  if (window.WorkoutState.currentRound >= newTotal) {
    showToast(t('cannot_reduce_rounds'), 'info');
    return;
  }

  window.WorkoutState.activeWorkout.exercises.forEach(ex => {
    const currentRounds = ex.rounds;
    if (newTotal > currentRounds.length) {
      for (let i = currentRounds.length; i < newTotal; i++) {
        currentRounds.push({
          roundNum: i + 1,
          weight: ex.defaultWeight,
          reps: ex.defaultReps,
          completed: false
        });
      }
    } else if (newTotal < currentRounds.length) {
      currentRounds.length = newTotal;
    }
  });

  window.WorkoutState.activeWorkout.totalSets = newTotal;

  const totalRoundsSpan = document.getElementById('total-rounds');
  if (totalRoundsSpan) totalRoundsSpan.textContent = window.WorkoutState.activeWorkout.totalSets;

  renderActiveWorkout();
  showToast(t('rounds_count') + ': ' + window.WorkoutState.activeWorkout.totalSets, 'success');
  window.WorkoutState.save();
}

function showConfirmModal(options) {
  return new Promise((resolve) => {
    const modal = document.getElementById('confirm-modal');
    const titleEl = document.getElementById('modal-title');
    const confirmBtn = document.getElementById('modal-confirm');
    const cancelBtn = document.getElementById('modal-cancel');

    if (!modal) {
      resolve(confirm(options.message || t('confirm_delete')));
      return;
    }

    if (titleEl) titleEl.textContent = options.title || t('confirm_finish_workout');

    modal.classList.remove('hidden');

    const handleConfirm = () => {
      modal.classList.add('hidden');
      cleanup();
      resolve(true);
    };

    const handleCancel = () => {
      modal.classList.add('hidden');
      cleanup();
      resolve(false);
    };

    const cleanup = () => {
      confirmBtn.removeEventListener('click', handleConfirm);
      cancelBtn.removeEventListener('click', handleCancel);
      modal.removeEventListener('click', handleOverlay);
    };

    const handleOverlay = (e) => {
      if (e.target === modal) {
        handleCancel();
      }
    };

    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
    modal.addEventListener('click', handleOverlay);
  });
}

async function finishWorkout() {
  if (!window.WorkoutState.activeWorkout) return;

  const isReadyToFinish = window.WorkoutState.isLastRoundReady;
  const allCompleted = window.WorkoutState.activeWorkout.exercises.every(ex => ex.rounds[window.WorkoutState.currentRound].completed);
  const isLastRound = (window.WorkoutState.currentRound + 1 === window.WorkoutState.activeWorkout.totalSets);

  if (isLastRound && !isReadyToFinish && !allCompleted) {
    await showConfirmModal({
      title: '❌ ' + t('cannot_finish'),
      message: t('check_all_exercises_to_finish')
    });
    return;
  }

  const confirmed = await showConfirmModal({
    title: '🏁 ' + t('confirm_finish_workout'),
    message: ''
  });

  if (!confirmed) return;

  stopSessionTimer();
  stopRestTimer();

  const session = {
    workoutId: window.WorkoutState.activeWorkout.workoutId,
    workoutName: window.WorkoutState.activeWorkout.workoutName,
    type: 'strength',
    startTime: window.WorkoutState.activeWorkout.startTime,
    endTime: new Date().toISOString(),
    duration: getSessionSeconds(),
    totalSets: window.WorkoutState.activeWorkout.totalSets,
    date: new Date().toLocaleDateString('fr-CA'),
    exercises: window.WorkoutState.activeWorkout.exercises.map(ex => ({
      exerciseId: ex.exerciseId,
      name: ex.name,
      muscle: ex.muscle,
      type: 'strength',
      sets: ex.rounds
    }))
  };

  try {
    await addSession(session);
    showToast(t('workout_completed'), 'success');
    playFinishSound();
  } catch (e) {
    showToast(t('error'), 'error');
  }

  window.WorkoutState.reset();
  window.WorkoutState.save();

  const pauseOverlay = document.getElementById('pause-overlay');
  if (pauseOverlay) pauseOverlay.classList.add('hidden');

  const finishBtn = document.getElementById('btn-finish-workout');
  if (finishBtn) {
    finishBtn.classList.remove('ready-to-finish');
    finishBtn.style.background = '';
    finishBtn.style.border = '';
    finishBtn.style.color = '';
  }

  renderWorkoutsList();
  renderHistoryList(); // odświeża listę
  
  // === TO JEST KLUCZOWE – ODŚWIEŻ KALENDARZ ===
  await loadSessionsData();
  renderCalendar(currentCalendarYear, currentCalendarMonth);
  
  showScreen('screen-home', 'GymTracker Pro');
}
// --- MEASUREMENTS ---
async function renderMeasurementsHistory() {
  const container = document.getElementById('measurements-history');
  if (!container) return;
  const measurements = await getAllMeasurements();
  container.innerHTML = '';

  if (measurements.length === 0) {
    container.innerHTML = '<div class="history-item"><p>' + t('no_data') + '</p></div>';
    return;
  }

  const sorted = measurements.sort((a, b) => new Date(b.date) - new Date(a.date));

  sorted.forEach(m => {
    const item = document.createElement('div');
    item.className = 'history-item';

    const fields = [
      { key: 'chest', label: t('chest') },
      { key: 'bicepsRight', label: t('biceps_right') },
      { key: 'bicepsLeft', label: t('biceps_left') },
      { key: 'thighRight', label: t('thigh_right') },
      { key: 'thighLeft', label: t('thigh_left') },
      { key: 'waist', label: t('waist') }
    ];

    const details = fields.map(f => {
      const val = m[f.key];
      return val ? `<span><strong>${val} cm</strong> ${f.label}</span>` : '';
    }).filter(Boolean).join('');

    item.innerHTML = `
      <div class="history-date">${m.date}</div>
      <div class="history-details">${details || '<span>-</span>'}</div>
    `;
    container.appendChild(item);
  });

  renderMeasurementsChart(measurements);
}

// --- STATS EXERCISE SELECT ---
async function renderStatsExerciseSelect() {
  const select = document.getElementById('stats-exercise-select');
  if (!select) return;
  const exercises = await getAllExercises();
  const strengthExercises = exercises.filter(ex => ex.type !== 'activity');
  select.innerHTML = '';
  
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = t('select_exercise');
  select.appendChild(defaultOption);
  
  if (strengthExercises.length === 0) {
    const noData = document.createElement('option');
    noData.value = '';
    noData.textContent = t('no_data_add_exercise');
    select.appendChild(noData);
  } else {
    strengthExercises.forEach(ex => {
      const opt = document.createElement('option');
      opt.value = ex.id;
      opt.textContent = ex.name;
      select.appendChild(opt);
    });
  }
  
  select.value = '';
  
  if (typeof renderStatsChart === 'function') {
    renderStatsChart('weight-chart', [], [], t('select_exercise'));
  }
  if (typeof renderStatsSummary === 'function') {
    renderStatsSummary([], 'weight-chart');
  }
}

// --- NUMBER INPUT HELPERS ---
function adjustValue(inputId, delta) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const step = parseFloat(input.step) || 1;
  const min = parseFloat(input.min) || 0;
  const max = parseFloat(input.max) || Infinity;
  let val = parseFloat(input.value) || 0;
  val += delta;
  if (val < min) val = min;
  if (val > max) val = max;
  const precision = step.toString().split('.')[1]?.length || 0;
  input.value = val.toFixed(precision);
}

function adjustActiveValue(inputId, delta) {
  adjustValue(inputId, delta);
}

// ============================================
// KALENDARZ HISTORII
// ============================================

let currentCalendarYear = new Date().getFullYear();
let currentCalendarMonth = new Date().getMonth();
let sessionsData = {};

async function loadSessionsData() {
  const sessions = await getAllSessions();
  sessionsData = {};
  sessions.forEach(session => {
    const dateKey = session.date.split('T')[0];
    if (!sessionsData[dateKey]) sessionsData[dateKey] = [];
    sessionsData[dateKey].push(session);
  });
}

function getMuscleColor(muscle) {
  const map = {
    'Klatka piersiowa': '#e94560',
    'Plecy': '#3498db',
    'Barki': '#f1c40f',
    'Biceps': '#e67e22',
    'Triceps': '#2ecc71',
    'Nogi': '#9b59b6',
    'Brzuch': '#1abc9c',
    'Inne': '#95a5a6'
  };
  return map[muscle] || '#95a5a6';
}

function renderCalendar(year, month) {
  const grid = document.getElementById('calendar-grid');
  const monthYear = document.getElementById('calendar-month-year');
  if (!grid || !monthYear) return;

  // === POBRANIE DANYCH NA ŻYWO Z BAZY ===
  getAllSessions().then(sessions => {
    const sessionsData = {};
    sessions.forEach(session => {
      const dateKey = session.date.split('T')[0];
      if (!sessionsData[dateKey]) sessionsData[dateKey] = [];
      sessionsData[dateKey].push(session);
    });

    const lang = localStorage.getItem('gym-lang') || 'pl';
    const months = translations[lang]?.months || translations['pl'].months;
    const weekdaysShort = translations[lang]?.weekdays_short || translations['pl'].weekdays_short;

    const date = new Date(year, month);
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const monthNames = Object.values(months);
    monthYear.textContent = `${monthNames[month]} ${year}`;

    const weekdaysEl = document.querySelector('.calendar-weekdays');
    if (weekdaysEl) {
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      weekdaysEl.innerHTML = days.map(d => `<span>${weekdaysShort[d]}</span>`).join('');
    }

    let startOffset = (firstDay === 0) ? 6 : firstDay - 1;
    grid.innerHTML = '';

    for (let i = 0; i < startOffset; i++) {
      const empty = document.createElement('div');
      empty.className = 'calendar-day other-month';
      grid.appendChild(empty);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isToday = dateStr === todayStr;

      const dayDiv = document.createElement('div');
      dayDiv.className = 'calendar-day';
      if (isToday) dayDiv.classList.add('today');

      const sessions = sessionsData[dateStr] || [];
      if (sessions.length > 0) {
        dayDiv.classList.add('has-workout');
      }

      const numberSpan = document.createElement('span');
      numberSpan.className = 'day-number';
      numberSpan.textContent = day;
      dayDiv.appendChild(numberSpan);

      if (sessions.length > 0) {
        const dotsContainer = document.createElement('div');
        dotsContainer.className = 'day-dots';
        
        const hasActivity = sessions.some(s => s.type === 'activity');
        if (hasActivity) {
          const icon = document.createElement('span');
          icon.className = 'activity-icon-small';
          icon.textContent = '🏃';
          dotsContainer.appendChild(icon);
        }
        
        const muscleSet = new Set();
        sessions.forEach(session => {
          if (session.type === 'activity') return;
          if (session.exercises) {
            session.exercises.forEach(ex => {
              if (ex.muscle) muscleSet.add(ex.muscle);
            });
          }
        });
        
        muscleSet.forEach(muscle => {
          const dot = document.createElement('span');
          dot.className = 'dot';
          dot.style.backgroundColor = getMuscleColor(muscle);
          dotsContainer.appendChild(dot);
        });
        
        dayDiv.appendChild(dotsContainer);
      }

      // KAŻDY DZIEŃ JEST KLIKALNY
      dayDiv.addEventListener('click', () => showDayDetails(dateStr));

      grid.appendChild(dayDiv);
    }

    currentCalendarYear = year;
    currentCalendarMonth = month;
  });
}

// ============================================
// DODAWANIE TRENINGU Z KALENDARZA
// ============================================
async function addWorkoutToDay(dateStr) {
  const workouts = await getAllWorkouts();
  if (workouts.length === 0) {
    showToast(t('no_workouts_to_add'), 'error');
    return;
  }

  // Pokaż modal z listą treningów
  const modal = document.getElementById('workout-select-modal');
  const listContainer = document.getElementById('workout-select-list');
  if (!modal || !listContainer) {
    // Fallback do prompt jeśli modal nie istnieje
    const options = workouts.map((wo, i) => 
      `${i + 1}. ${wo.name}${wo.type === 'activity' ? ' 🏃' : ''}`
    ).join('\n');
    const choice = prompt(t('select_workout_to_add') + ':\n' + options);
    if (choice === null) return;
    const index = parseInt(choice) - 1;
    if (isNaN(index) || index < 0 || index >= workouts.length) {
      showToast(t('error'), 'error');
      return;
    }
    await addWorkoutToDayByIndex(dateStr, index);
    return;
  }

  // Przygotuj listę
  listContainer.innerHTML = '';
  workouts.forEach((wo, index) => {
    const div = document.createElement('div');
    div.style.cssText = `
      padding: 10px 12px;
      border-bottom: 1px solid var(--border);
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: 0.15s;
    `;
    div.innerHTML = `
      <span>${escapeHtml(wo.name)}</span>
      <span style="font-size: 0.7rem; color: var(--text-secondary);">${wo.type === 'activity' ? '🏃' : '💪'}</span>
    `;
    div.addEventListener('click', () => {
      modal.classList.add('hidden');
      addWorkoutToDayByIndex(dateStr, index);
    });
    div.addEventListener('mouseenter', () => {
      div.style.background = 'var(--surface-hover)';
    });
    div.addEventListener('mouseleave', () => {
      div.style.background = 'transparent';
    });
    listContainer.appendChild(div);
  });

  modal.classList.remove('hidden');

  // Anuluj
  document.getElementById('workout-select-cancel')?.addEventListener('click', () => {
    modal.classList.add('hidden');
  });
  // Kliknięcie w tło
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.add('hidden');
  });
}

async function addWorkoutToDayByIndex(dateStr, index) {
  const workouts = await getAllWorkouts();
  if (index < 0 || index >= workouts.length) {
    showToast(t('error'), 'error');
    return;
  }
  
  const workout = workouts[index];
  
  const sessions = await getAllSessions();
  const existing = sessions.filter(s => {
    const sDate = s.date.split('T')[0];
    return sDate === dateStr && s.workoutId === workout.id;
  });
  
  if (existing.length > 0) {
    showToast('Trening już istnieje w tym dniu', 'info');
    return;
  }
  
  let exercises = [];
  
  if (workout.type === 'activity') {
    const exId = workout.exercises?.[0];
    if (exId) {
      const ex = await getExercise(exId);
      exercises = [{
        exerciseId: exId,
        name: ex ? ex.name : 'Aktywność',
        type: 'activity',
        duration: 0,
        note: '',
        completed: true
      }];
    }
  } else {
    if (workout.exercises) {
      const allExercises = await getAllExercises();
      exercises = workout.exercises.map(exId => {
        const ex = allExercises.find(e => e.id === exId);
        const defaultWeight = ex ? ex.weight || 0 : 0;
        const defaultReps = ex ? ex.reps || 8 : 8;
        const sets = [];
        for (let i = 0; i < (workout.sets || 4); i++) {
          sets.push({
            weight: defaultWeight,
            reps: defaultReps,
            completed: true
          });
        }
        return {
          exerciseId: exId,
          name: ex ? ex.name : 'Ćwiczenie',
          type: 'strength',
          muscle: ex ? ex.muscle : 'Inne', // <--- TO JEST KLUCZOWE
          sets: sets
        };
      });
    }
  }
  
  const session = {
    workoutId: workout.id,
    workoutName: workout.name,
    type: workout.type || 'strength',
    startTime: new Date(dateStr + 'T12:00:00').toISOString(),
    endTime: new Date(dateStr + 'T13:00:00').toISOString(),
    duration: 0,
    totalSets: workout.sets || 0,
    date: dateStr,
    exercises: exercises
  };
  
  try {
    const newSessionId = await addSession(session);
    session.id = newSessionId;
    
    if (!sessionsData[dateStr]) {
      sessionsData[dateStr] = [];
    }
    sessionsData[dateStr].push(session);
    
    showToast(t('workout_added_to_day'), 'success');
    
    const modal = document.getElementById('workout-select-modal');
    if (modal) modal.classList.add('hidden');
    
    renderCalendar(currentCalendarYear, currentCalendarMonth);
    showDayDetails(dateStr);
    
  } catch (e) {
    console.error(e);
    showToast(t('error'), 'error');
  }
}
async function showDayDetails(dateStr) {
  const container = document.getElementById('day-details');
  if (!container) return;

  const lang = localStorage.getItem('gym-lang') || 'pl';
  const weekdays = translations[lang]?.weekdays || translations['pl'].weekdays;
  const months = translations[lang]?.months || translations['pl'].months;

  const sessions = sessionsData[dateStr] || [];
  
  const dateObj = new Date(dateStr + 'T00:00:00');
  const dayName = weekdays[['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][dateObj.getDay()]];
  const monthName = Object.values(months)[dateObj.getMonth()];
  const formattedDate = `${dayName}, ${dateObj.getDate()} ${monthName} ${dateObj.getFullYear()}`;

  let html = `
    <div class="detail-header">
      <span class="detail-date">${formattedDate}</span>
      <div>
        <button id="add-workout-to-day" class="btn-secondary" style="padding: 4px 10px; font-size: 0.7rem; margin-right: 6px;" data-key="add_workout_to_day">+ Dodaj trening</button>
        <button class="detail-close" id="detail-close">×</button>
      </div>
    </div>
  `;

  if (sessions.length === 0) {
    html += `<div class="no-workouts">${t('no_workouts_this_day')}</div>`;
    container.innerHTML = html;
    
    document.getElementById('add-workout-to-day')?.addEventListener('click', () => {
      addWorkoutToDay(dateStr);
    });
    document.getElementById('detail-close')?.addEventListener('click', () => {
      container.innerHTML = '';
    });
    return;
  }

  sessions.forEach((session) => {
    const isActivity = session.type === 'activity';
    const duration = session.duration ? formatTime(session.duration) : '-';
    
    let totalSets = 0;
    let completedSets = 0;
    if (session.exercises && !isActivity) {
      session.exercises.forEach(ex => {
        if (ex.sets) {
          totalSets += ex.sets.length;
          completedSets += ex.sets.filter(s => s.completed).length;
        }
      });
    }

    html += `
      <div class="detail-session">
        <button class="delete-session-btn" data-session-id="${session.id}" title="${t('delete_session')}">🗑</button>
        <h4>${isActivity ? '🏃 ' : ''}${escapeHtml(session.workoutName || 'Trening')}</h4>
        <div class="session-meta">${duration} ${!isActivity ? `• ${completedSets}/${totalSets} ${t('sets').toLowerCase()}` : ''}</div>
    `;

    if (session.exercises) {
      session.exercises.forEach(ex => {
        if (ex.type === 'activity') {
          html += `<div class="session-exercise">🏃 <strong>${escapeHtml(ex.name)}</strong> 
            <span class="set-info">${ex.duration ? formatTime(ex.duration) : t('no_duration')}</span>
            ${ex.note ? ' 📝 ' + escapeHtml(ex.note) : ''}
          </div>`;
        } else {
          const setsStr = (ex.sets || [])
            .filter(s => s.completed)
            .map(s => `${s.weight}kg × ${s.reps}`)
            .join(', ');
          if (setsStr) {
            html += `<div class="session-exercise"><strong>${escapeHtml(ex.name)}</strong> <span class="set-info">${setsStr}</span></div>`;
          }
        }
      });
    }

    html += `</div>`;
  });

  container.innerHTML = html;

  // NASŁUCHIWACZ DLA PRZYCISKU "DODAJ TRENING" – ZAWSZE
  document.getElementById('add-workout-to-day')?.addEventListener('click', () => {
    addWorkoutToDay(dateStr);
  });

  document.getElementById('detail-close')?.addEventListener('click', () => {
    container.innerHTML = '';
  });

  document.querySelectorAll('.delete-session-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const sessionId = parseInt(btn.dataset.sessionId);
      if (confirm(t('confirm_delete_session'))) {
        try {
          await deleteSession(sessionId);
          showToast(t('session_deleted'), 'success');
          await loadSessionsData();
          renderCalendar(currentCalendarYear, currentCalendarMonth);
          const details = document.getElementById('day-details');
          if (details) details.innerHTML = '';
        } catch (err) {
          showToast(t('error'), 'error');
        }
      }
    });
  });
}

function initCalendarNavigation() {
  document.getElementById('calendar-prev')?.addEventListener('click', () => {
    if (currentCalendarMonth === 0) {
      currentCalendarMonth = 11;
      currentCalendarYear--;
    } else {
      currentCalendarMonth--;
    }
    renderCalendar(currentCalendarYear, currentCalendarMonth);
  });

  document.getElementById('calendar-next')?.addEventListener('click', () => {
    if (currentCalendarMonth === 11) {
      currentCalendarMonth = 0;
      currentCalendarYear++;
    } else {
      currentCalendarMonth++;
    }
    renderCalendar(currentCalendarYear, currentCalendarMonth);
  });
}

window.renderHistoryList = async function() {
  await loadSessionsData();
  renderCalendar(currentCalendarYear, currentCalendarMonth);
  initCalendarNavigation();
};

// ============================================
// ZWIJANA BIBLIOTEKA ĆWICZEŃ
// ============================================

function toggleExercisesList() {
  const list = document.getElementById('exercises-list');
  const btn = document.getElementById('btn-toggle-exercises');
  if (!list || !btn) return;

  const isCollapsed = list.classList.toggle('collapsed');
  
  localStorage.setItem('gym-exercises-collapsed', isCollapsed ? 'true' : 'false');
  
  if (isCollapsed) {
    btn.textContent = t('show_exercises');
    btn.setAttribute('data-key', 'show_exercises');
  } else {
    btn.textContent = t('hide_exercises');
    btn.setAttribute('data-key', 'hide_exercises');
  }
}

function initExercisesToggle() {
  const btn = document.getElementById('btn-toggle-exercises');
  const list = document.getElementById('exercises-list');
  if (!btn || !list) return;

  const isCollapsed = localStorage.getItem('gym-exercises-collapsed') === 'true';
  
  if (isCollapsed) {
    list.classList.add('collapsed');
    btn.textContent = t('show_exercises');
    btn.setAttribute('data-key', 'show_exercises');
  } else {
    list.classList.remove('collapsed');
    btn.textContent = t('hide_exercises');
    btn.setAttribute('data-key', 'hide_exercises');
  }

  btn.addEventListener('click', toggleExercisesList);
}

/* ============================================
   STATYSTYKI AKTYWNOŚCI
   ============================================ */

let activityChart = null;
let currentActivityPeriod = 'month';
let currentActivityId = null;
let currentPeriodDate = new Date();

async function renderActivityStats() {
  const activitySelect = document.getElementById('stats-activity-select');
  const summaryContainer = document.getElementById('activity-stats-summary');
  const listContainer = document.getElementById('activity-list');
  const container = document.getElementById('activity-stats-container');
  
  if (!summaryContainer || !listContainer || !container) return;
  
  container.style.display = 'block';
  
  summaryContainer.innerHTML = '';
  listContainer.innerHTML = '';
  if (activityChart) {
    activityChart.destroy();
    activityChart = null;
  }
  
  const exercises = await getAllExercises();
  const activities = exercises.filter(ex => ex.type === 'activity');
  
  activitySelect.innerHTML = '';
  
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = t('select_activity');
  activitySelect.appendChild(defaultOption);
  
  if (activities.length === 0) {
    summaryContainer.innerHTML = `<div class="stat-box" style="grid-column: span 2;"><div class="stat-value">-</div><div class="stat-label">${t('no_activities')}</div></div>`;
    listContainer.innerHTML = '';
    return;
  }
  
  activities.forEach(ex => {
    const opt = document.createElement('option');
    opt.value = ex.id;
    const label = ex.note ? `${ex.name} (${ex.note})` : ex.name;
    opt.textContent = label;
    activitySelect.appendChild(opt);
  });
  
  activitySelect.value = '';
  currentActivityId = null;
  
  await updateYearRange();
  
  activitySelect.onchange = () => {
    currentActivityId = activitySelect.value;
    if (currentActivityId) {
      updateActivityStats();
    } else {
      summaryContainer.innerHTML = '';
      listContainer.innerHTML = '';
      if (activityChart) {
        activityChart.destroy();
        activityChart = null;
      }
    }
  };
  
  document.querySelectorAll('.period-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentActivityPeriod = btn.dataset.period;
      
      const selectors = document.getElementById('stats-period-selectors');
      if (currentActivityPeriod === 'today') {
        selectors.style.display = 'none';
      } else {
        selectors.style.display = 'flex';
      }
      
      if (currentActivityPeriod !== 'today') {
        currentPeriodDate = new Date();
        updatePeriodSelectors();
      }
      
      if (currentActivityId) {
        updateActivityStats();
      }
    };
  });
  
  initPeriodSelectors();
}

async function updateYearRange() {
  const sessions = await getAllSessions();
  const yearSelect = document.getElementById('stats-year-select');
  if (!yearSelect) return;
  
  let minYear = new Date().getFullYear();
  let maxYear = new Date().getFullYear();
  
  sessions.forEach(s => {
    const year = new Date(s.date).getFullYear();
    if (year < minYear) minYear = year;
    if (year > maxYear) maxYear = year;
  });
  
  if (sessions.length === 0) {
    minYear = maxYear = new Date().getFullYear();
  }
  
  yearSelect.innerHTML = '';
  for (let y = maxYear; y >= minYear; y--) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    yearSelect.appendChild(opt);
  }
  
  const currentYear = new Date().getFullYear();
  if (yearSelect.querySelector(`option[value="${currentYear}"]`)) {
    yearSelect.value = currentYear;
  } else {
    yearSelect.value = maxYear;
  }
}

function initPeriodSelectors() {
  const monthSelect = document.getElementById('stats-month-select');
  const yearSelect = document.getElementById('stats-year-select');
  
  if (!monthSelect || !yearSelect) return;
  
  const lang = localStorage.getItem('gym-lang') || 'pl';
  const monthNames = Object.values(translations[lang]?.months || translations['pl'].months);
  
  monthSelect.innerHTML = '';
  monthNames.forEach((name, index) => {
    const opt = document.createElement('option');
    opt.value = index;
    opt.textContent = name;
    monthSelect.appendChild(opt);
  });
  
  const now = new Date();
  monthSelect.value = now.getMonth();
  
  if (!yearSelect.value) {
    yearSelect.value = now.getFullYear();
  }
  
  monthSelect.onchange = () => {
    const selectedYear = parseInt(yearSelect.value) || new Date().getFullYear();
    const selectedMonth = parseInt(monthSelect.value);
    currentPeriodDate = new Date(selectedYear, selectedMonth, 1);
    if (currentActivityId) updateActivityStats();
  };
  
  yearSelect.onchange = () => {
    const selectedYear = parseInt(yearSelect.value) || new Date().getFullYear();
    const selectedMonth = parseInt(monthSelect.value) || new Date().getMonth();
    currentPeriodDate = new Date(selectedYear, selectedMonth, 1);
    if (currentActivityId) updateActivityStats();
  };
}

function updatePeriodSelectors() {
  const monthSelect = document.getElementById('stats-month-select');
  const yearSelect = document.getElementById('stats-year-select');
  if (!monthSelect || !yearSelect) return;
  
  const now = new Date();
  if (yearSelect.querySelector(`option[value="${now.getFullYear()}"]`)) {
    yearSelect.value = now.getFullYear();
  }
  monthSelect.value = now.getMonth();
}

async function updateActivityStats() {
  const activityId = currentActivityId;
  if (!activityId) return;
  
  const sessions = await getAllSessions();
  const activitySessions = sessions.filter(s => {
    return s.type === 'activity' && s.exercises && s.exercises.some(ex => ex.exerciseId === parseInt(activityId));
  });
  
  const now = new Date();
  let startDate = new Date();
  
  if (currentActivityPeriod === 'today') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    startDate.setHours(0, 0, 0, 0);
  } else {
    const refDate = currentPeriodDate || new Date();
    
    switch(currentActivityPeriod) {
      case 'week':
        startDate = new Date(refDate);
        startDate.setDate(refDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(refDate.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(refDate);
        startDate.setMonth(refDate.getMonth() - 1);
    }
  }
  
  const filtered = activitySessions.filter(s => {
    const sessionDate = new Date(s.date);
    return sessionDate >= startDate && sessionDate <= now;
  });
  
  const total = filtered.length;
  const totalTime = filtered.reduce((sum, s) => sum + (s.duration || 0), 0);
  const avgTime = total > 0 ? Math.round(totalTime / total) : 0;
  const longest = total > 0 ? Math.max(...filtered.map(s => s.duration || 0)) : 0;
  
  const summaryContainer = document.getElementById('activity-stats-summary');
  summaryContainer.innerHTML = `
    <div class="stat-box">
      <div class="stat-value">${total}</div>
      <div class="stat-label">${t('activity_count')}</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">${formatTime(totalTime)}</div>
      <div class="stat-label">${t('total_activity_time')}</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">${formatTime(avgTime)}</div>
      <div class="stat-label">${t('avg_activity_time')}</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">${formatTime(longest)}</div>
      <div class="stat-label">${t('longest_activity')}</div>
    </div>
  `;
  
  renderActivityChart(filtered);
  
  const listContainer = document.getElementById('activity-list');
  if (filtered.length === 0) {
    listContainer.innerHTML = `<div class="history-item"><p>${t('no_activities')}</p></div>`;
    return;
  }
  
  const sorted = filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  const lang = localStorage.getItem('gym-lang') || 'pl';
  
  listContainer.innerHTML = sorted.map(session => {
    const date = new Date(session.date);
    const dateStr = date.toLocaleDateString(lang);
    const duration = session.duration ? formatTime(session.duration) : '-';
    const name = session.workoutName || 'Aktywność';
    const note = session.exercises?.[0]?.note || '';
    
    return `
      <div class="history-item">
        <div class="history-date">${dateStr}</div>
        <div style="font-weight: 700; margin-bottom: 4px;">🏃 ${escapeHtml(name)}${note ? ' • ' + escapeHtml(note) : ''}</div>
        <div style="font-size: 0.85rem; color: var(--text-secondary);">
          ⏱️ ${duration}
        </div>
      </div>
    `;
  }).join('');
}

function renderActivityChart(sessions) {
  const ctx = document.getElementById('activity-chart');
  if (!ctx) return;
  
  if (activityChart) {
    activityChart.destroy();
    activityChart = null;
  }
  
  if (sessions.length === 0) {
    return;
  }
  
  const lang = localStorage.getItem('gym-lang') || 'pl';
  const grouped = {};
  
  sessions.forEach(s => {
    const date = new Date(s.date);
    let key;
    
    if (currentActivityPeriod === 'today') {
      key = date.toLocaleDateString(lang, { hour: '2-digit', minute: '2-digit' });
    } else if (currentActivityPeriod === 'week') {
      key = date.toLocaleDateString(lang, { weekday: 'short' });
    } else if (currentActivityPeriod === 'month') {
      key = date.toLocaleDateString(lang, { day: 'numeric', month: 'short' });
    } else {
      key = date.toLocaleDateString(lang, { month: 'short', year: 'numeric' });
    }
    grouped[key] = (grouped[key] || 0) + 1;
  });
  
  const labels = Object.keys(grouped);
  const data = Object.values(grouped);
  
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const textColor = isDark ? '#a0a0b0' : '#636e72';
  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  
  activityChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: t('activity_count'),
        data: data,
        backgroundColor: '#ff3366',
        borderRadius: 4,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { color: textColor, font: { size: 10 } }
        },
        y: {
          grid: { color: gridColor },
          ticks: { color: textColor, font: { size: 10 }, stepSize: 1 },
          beginAtZero: true
        }
      }
    }
  });
}

function switchStatsTab(tabType) {
  const activityContainer = document.getElementById('activity-stats-container');
  const exerciseSelectGroup = document.getElementById('exercise-select-group');
  const statsSummary = document.getElementById('stats-summary');
  const chartContainer = document.getElementById('main-chart')?.parentElement;
  const activityChartContainer = document.getElementById('activity-chart-container');

  if (!activityContainer) return;

  if (tabType === 'activity-stats') {
    activityContainer.classList.remove('hidden');
    if (exerciseSelectGroup) exerciseSelectGroup.classList.add('hidden');
    if (statsSummary) statsSummary.classList.add('hidden');
    if (chartContainer) chartContainer.classList.add('hidden');
    if (activityChartContainer) activityChartContainer.classList.remove('hidden');
    
    currentActivityId = null; 
    currentActivityPeriod = null;
    
    document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
    
    const selectors = document.getElementById('stats-period-selectors');
    if (selectors) selectors.style.display = 'none';

    renderActivityStats();
  } else {
    activityContainer.classList.add('hidden');
    if (exerciseSelectGroup) exerciseSelectGroup.classList.remove('hidden');
    if (statsSummary) statsSummary.classList.remove('hidden');
    if (chartContainer) chartContainer.classList.remove('hidden');
    if (activityChartContainer) activityChartContainer.classList.add('hidden');
    
    const select = document.getElementById('stats-exercise-select');
    if (select) {
      select.value = '';
    }
    
    if (typeof renderStatsChart === 'function') {
      renderStatsChart(tabType === 'weight-chart' ? 'weight-chart' : 'volume-chart', [], [], t('select_exercise'));
    }
    if (typeof renderStatsSummary === 'function') {
      renderStatsSummary([], tabType === 'weight-chart' ? 'weight-chart' : 'volume-chart');
    }
  }
}
