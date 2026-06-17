const DB_NAME = 'GymTrackerDB';
const DB_VERSION = 3;

let db = null;

function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      // Tworzymy tylko nowe store'y – bez otwierania dodatkowych transakcji
      if (!database.objectStoreNames.contains('exercises')) {
        const exStore = database.createObjectStore('exercises', { keyPath: 'id', autoIncrement: true });
        exStore.createIndex('name', 'name', { unique: false });
        exStore.createIndex('muscle', 'muscle', { unique: false });
        exStore.createIndex('type', 'type', { unique: false });
      }
      if (!database.objectStoreNames.contains('workouts')) {
        const woStore = database.createObjectStore('workouts', { keyPath: 'id', autoIncrement: true });
        woStore.createIndex('name', 'name', { unique: false });
        woStore.createIndex('type', 'type', { unique: false });
      }
      if (!database.objectStoreNames.contains('sessions')) {
        const sessStore = database.createObjectStore('sessions', { keyPath: 'id', autoIncrement: true });
        sessStore.createIndex('date', 'date', { unique: false });
        sessStore.createIndex('workoutId', 'workoutId', { unique: false });
        sessStore.createIndex('type', 'type', { unique: false });
      }
      if (!database.objectStoreNames.contains('measurements')) {
        const msStore = database.createObjectStore('measurements', { keyPath: 'id', autoIncrement: true });
        msStore.createIndex('date', 'date', { unique: false });
      }
    };
    request.onblocked = () => {
      console.warn('IndexedDB blocked - close other tabs');
      reject(new Error('Database blocked - close other tabs'));
    };
  });
}

function addItem(storeName, data) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction([storeName], 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.add(data);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getItem(storeName, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction([storeName], 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getAllItems(storeName) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction([storeName], 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function updateItem(storeName, data) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction([storeName], 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.put(data);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function deleteItem(storeName, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction([storeName], 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// ----- ĆWICZENIA -----
function addExercise(exercise) {
  return addItem('exercises', { 
    ...exercise, 
    type: exercise.type || 'strength',
    measureDuration: exercise.measureDuration !== undefined ? exercise.measureDuration : true,
    createdAt: new Date().toISOString() 
  });
}
function getExercise(id) { return getItem('exercises', id); }
function getAllExercises() { return getAllItems('exercises'); }
function updateExercise(exercise) { return updateItem('exercises', exercise); }
function deleteExercise(id) { return deleteItem('exercises', id); }

// ----- TRENINGI -----
function addWorkout(workout) {
  return addItem('workouts', { 
    ...workout, 
    type: workout.type || 'strength',
    createdAt: new Date().toISOString() 
  });
}
function getWorkout(id) { return getItem('workouts', id); }
function getAllWorkouts() { return getAllItems('workouts'); }
function updateWorkout(workout) { return updateItem('workouts', workout); }
function deleteWorkout(id) { return deleteItem('workouts', id); }

// ----- SESJE -----
function addSession(session) {
  return addItem('sessions', {
    ...session,
    type: session.type || 'strength',
    createdAt: new Date().toISOString()
  });
}
function getSession(id) { return getItem('sessions', id); }
function getAllSessions() { return getAllItems('sessions'); }
function deleteSession(id) { return deleteItem('sessions', id); }

// ----- POMIARY -----
function addMeasurement(measurement) {
  return addItem('measurements', { ...measurement, createdAt: new Date().toISOString() });
}
function getMeasurement(id) { return getItem('measurements', id); }
function getAllMeasurements() { return getAllItems('measurements'); }
function updateMeasurement(m) { return updateItem('measurements', m); }
function deleteMeasurement(id) { return deleteItem('measurements', id); }

// ----- EKSPORT / IMPORT -----
async function exportAllData() {
  const data = {
    exercises: await getAllExercises(),
    workouts: await getAllWorkouts(),
    sessions: await getAllSessions(),
    measurements: await getAllMeasurements(),
    exportedAt: new Date().toISOString(),
    version: DB_VERSION
  };
  return JSON.stringify(data, null, 2);
}

async function importAllData(jsonString) {
  const data = JSON.parse(jsonString);
  const stores = ['exercises', 'workouts', 'sessions', 'measurements'];
  for (const storeName of stores) {
    const tx = db.transaction([storeName], 'readwrite');
    const store = tx.objectStore(storeName);
    await new Promise((resolve, reject) => {
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
  if (data.exercises) for (const item of data.exercises) await addItem('exercises', item);
  if (data.workouts) for (const item of data.workouts) await addItem('workouts', item);
  if (data.sessions) for (const item of data.sessions) await addItem('sessions', item);
  if (data.measurements) for (const item of data.measurements) await addItem('measurements', item);
}

// ----- STATYSTYKI -----
async function getExerciseStats(exerciseId) {
  const sessions = await getAllSessions();
  const stats = [];
  for (const session of sessions) {
    if (session.type === 'activity') continue;
    if (!session.exercises) continue;
    for (const ex of session.exercises) {
      if (ex.exerciseId === exerciseId || ex.id === exerciseId) {
        let maxWeight = 0;
        let totalVolume = 0;
        for (const set of (ex.sets || [])) {
          if (set.completed) {
            const w = parseFloat(set.weight) || 0;
            const r = parseInt(set.reps) || 0;
            if (w > maxWeight) maxWeight = w;
            totalVolume += w * r;
          }
        }
        if (maxWeight > 0 || totalVolume > 0) {
          stats.push({ date: session.date, maxWeight, totalVolume, sets: ex.sets.filter(s => s.completed).length });
        }
      }
    }
  }
  return stats.sort((a, b) => new Date(a.date) - new Date(b.date));
}

async function getVolumeStats() {
  const sessions = await getAllSessions();
  const volumeByDate = {};
  for (const session of sessions) {
    if (session.type === 'activity') continue;
    if (!session.exercises) continue;
    let sessionVolume = 0;
    for (const ex of session.exercises) {
      for (const set of (ex.sets || [])) {
        if (set.completed) {
          sessionVolume += (parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0);
        }
      }
    }
    const dateKey = session.date.split('T')[0];
    volumeByDate[dateKey] = (volumeByDate[dateKey] || 0) + sessionVolume;
  }
  return Object.entries(volumeByDate)
    .map(([date, volume]) => ({ date, volume }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}
