const MUSCLE_GROUP_MAP = {
  'Klatka piersiowa': 'chest',
  'Plecy': 'back',
  'Barki': 'shoulders',
  'Biceps': 'biceps',
  'Triceps': 'triceps',
  'Nogi': 'legs',
  'Brzuch': 'abs',
  'Inne': 'other'
};

function translateMuscleGroup(name, lang = null) {
  const currentLang = lang || localStorage.getItem('gym-lang') || 'pl';
  const key = MUSCLE_GROUP_MAP[name];
  if (key && translations[currentLang]?.[key]) {
    return translations[currentLang][key];
  }
  return name;
}

const translations = {
  pl: {
    my_workouts: "Moje Treningi",
    exercise_library: "Biblioteka Ćwiczeń",
    home: "Start",
    stats: "Statystyki",
    measurements: "Pomiary",
    history: "Historia",
    settings: "Ustawienia",
    menu: "Menu",
    back: "Wstecz",
    new_workout: "+ Nowy Trening",
    new_exercise: "+ Ćwiczenie",
    save: "Zapisz",
    cancel: "Anuluj",
    save_workout: "Zapisz Trening",
    skip: "Pomiń cwiczenie",
    finish_workout: "Zakończ trening",
    finish_round: "Zakończ Runde",
    export_data: "Eksportuj dane (JSON)",
    import_data: "Importuj dane (JSON)",
    save_measurement: "Zapisz Pomiar",
    define_exercise: "Definiuj Ćwiczenie",
    exercise_name: "Nazwa ćwiczenia",
    muscle_group: "Grupa mieśniowa",
    sets: "Serie",
    weight: "Waga",
    reps: "Powtórzenia",
    rest_time: "Przerwa między seriami (sek)",
    exercise_placeholder: "np. Wyciskanie sztangi",
    global_sets: "Liczba serii (dla wszystkich cwiczeń)",
    chest: "Klatka piersiowa",
    back: "Plecy",
    shoulders: "Barki",
    biceps: "Biceps",
    triceps: "Triceps",
    legs: "Nogi",
    abs: "Brzuch",
    other: "Inne",
    define_workout: "Definiuj Trening",
    workout_name: "Nazwa treningu",
    select_exercises: "Wybierz ćwiczenia:",
    workout_placeholder: "np. Pierś i Biceps",
    no_exercises_selected: "Wybierz przynajmniej jedno ćwiczenie",
    set: "Seria",
    status: "Status",
    next_round_in: "Następna runda za:",
    round: "Runda",
    exercise: "Ćwiczenie",
    done: "Zrobione",
    session_timer: "Czas sesji",
    rest_timer: "Przerwa",
    exercise_completed: "Ćwiczenie ukończone!",
    workout_completed: "Trening ukończony!",
    all_sets_done: "Wszystkie serie wykonane",
    skipped: "Pominięto",
    statistics: "Statystyki",
    weight_progress: "Postęp cieżaru",
    volume: "Objetość",
    body_measurements: "Pomiary Ciała",
    select_exercise: "Wybierz ćwiczenie",
    no_data: "Brak danych",
    pr: "Rekord",
    total_volume: "Całkowita objętość",
    avg_weight: "Średni ciężar",
    max_weight: "Maks. ciężar",
    workouts_count: "Liczba treningów",
    date: "Data",
    biceps_right: "Biceps P (cm)",
    biceps_left: "Biceps L (cm)",
    thigh_right: "Udo P (cm)",
    thigh_left: "Udo L (cm)",
    waist: "Talia (cm)",
    weight_kg: "Waga (kg)",
    measurements_history: "Historia pomiarów",
    appearance: "Wyglad",
    dark_mode: "Tryb ciemny",
    language: "Język",
    data: "Dane",
    polish: "Polski",
    english: "English",
    saved: "Zapisano!",
    deleted: "Usunięto!",
    updated: "Zaktualizowano!",
    error: "Blęd!",
    confirm_delete: "Czy na pewno chcesz usunać?",
    import_success: "Dane zaimportowane pomyślnie",
    import_error: "Błąd importu danych",
    export_success: "Dane wyeksportowane",
    workout_started: "Rozpoczęto trening!",
    rest_finished: "Koniec przerwy!",
    fill_required: "Wypełnij wymagane pola",
    workout_history: "Historia Treningów",
    no_history: "Brak historii treningów",
    duration: "Czas trwania",
    exercises_done: "Wykonane ćwiczenia",
    total_sets: "Wszystkie serie",
    completed_sets: "Wykonane serie",
    edit: "Edytuj",
    delete: "Usuń",
    start: "Start",
    workout_paused: "Trening wstrzymany",
    resume_workout: "Wznów trening",
    click_to_resume: "Kliknij aby wznowić",
    rest_label: "Przerwa",
    check_all_exercises: "Zaznacz wszystkie ćwiczenia",
    cannot_finish: "Nie można zakończyć",
    check_all_exercises_to_finish: "Zaznacz wszystkie ćwiczenia w ostatniej rundzie przed zakończeniem treningu.",
    confirm_finish_workout: "Zakończyć trening?",
    progress_will_be_saved: "Postępy zostaną zapisane.",
    rounds_count: "Liczba rund",
    resume_to_continue: "Wznów trening aby kontynuować",
    wait_for_rest: "Odczekaj przerwę",
    rest_in_progress: "Trwa przerwa...",
    cannot_change_rest: "Nie można zmienić przerwy podczas odliczania",
    cannot_change_rounds: "Nie można zmienić liczby rund podczas odliczania",
    cannot_reduce_rounds: "Nie można zmniejszyć - jesteś za daleko w treningu",
    click_finish_to_save: "Kliknij \"Zakończ trening\" aby zapisać",
    round_x_of_y: "Runda {0} z {1} - zaczynaj!",
    rest_x_next_round_y: "Przerwa {0}s → Runda {1}",
    finish_workout_btn: "Zakończ Trening",
    complete_round: "ZAKOŃCZ RUNDĘ",
    complete_workout: "ZAKOŃCZ TRENING",
    done_count_total: "{0}/{1} Zrobione",
    done_count_finish_workout: "{0}/{1} zrobione - ZAKOŃCZ TRENING",
done_count_finish_round: "{0}/{1} zrobione - ZAKOŃCZ RUNDĘ",
    database_error: "Błąd bazy danych",
    light_mode: "Tryb jasny",
    stats_info: "Wybierz ćwiczenie aby zobaczyć jak zmieniał się Twój ciężar w czasie. Wykres pokazuje największy ciężar z każdego treningu dla danego ćwiczenia."
  },

  en: {
    my_workouts: "My Workouts",
    exercise_library: "Exercise Library",
    home: "Home",
    stats: "Stats",
    measurements: "Measurements",
    history: "History",
    settings: "Settings",
    menu: "Menu",
    back: "Back",
    new_workout: "+ New Workout",
    new_exercise: "+ Exercise",
    save: "Save",
    cancel: "Cancel",
    save_workout: "Save Workout",
    skip: "Skip exercise",
    finish_workout: "Finish workout",
    finish_round: "Finish Round",
    export_data: "Export data (JSON)",
    import_data: "Import data (JSON)",
    save_measurement: "Save Measurement",
    define_exercise: "Define Exercise",
    exercise_name: "Exercise name",
    muscle_group: "Muscle group",
    sets: "Sets",
    weight: "Weight",
    reps: "Reps",
    rest_time: "Rest between sets (sec)",
    exercise_placeholder: "e.g. Bench Press",
    global_sets: "Number of sets (for all exercises)",
    chest: "Chest",
    back: "Back",
    shoulders: "Shoulders",
    biceps: "Biceps",
    triceps: "Triceps",
    legs: "Legs",
    abs: "Abs",
    other: "Other",
    define_workout: "Define Workout",
    workout_name: "Workout name",
    select_exercises: "Select exercises:",
    workout_placeholder: "e.g. Chest & Biceps",
    no_exercises_selected: "Select at least one exercise",
    set: "Set",
    status: "Status",
    next_round_in: "Next round in:",
    round: "Round",
    exercise: "Exercise",
    done: "Done",
    session_timer: "Session time",
    rest_timer: "Rest",
    exercise_completed: "Exercise completed!",
    workout_completed: "Workout completed!",
    all_sets_done: "All sets done",
    skipped: "Skipped",
    statistics: "Statistics",
    weight_progress: "Weight progress",
    volume: "Volume",
    body_measurements: "Body Measurements",
    select_exercise: "Select exercise",
    no_data: "No data",
    pr: "PR",
    total_volume: "Total volume",
    avg_weight: "Avg weight",
    max_weight: "Max weight",
    workouts_count: "Workouts count",
    date: "Date",
    biceps_right: "Biceps R (cm)",
    biceps_left: "Biceps L (cm)",
    thigh_right: "Thigh R (cm)",
    thigh_left: "Thigh L (cm)",
    waist: "Waist (cm)",
    weight_kg: "Weight (kg)",
    measurements_history: "Measurements history",
    appearance: "Appearance",
    dark_mode: "Dark mode",
    language: "Language",
    data: "Data",
    polish: "Polski",
    english: "English",
    saved: "Saved!",
    deleted: "Deleted!",
    updated: "Updated!",
    error: "Error!",
    confirm_delete: "Are you sure you want to delete?",
    import_success: "Data imported successfully",
    import_error: "Error importing data",
    export_success: "Data exported",
    workout_started: "Workout started!",
    rest_finished: "Rest finished!",
    fill_required: "Fill required fields",
    workout_history: "Workout History",
    no_history: "No workout history",
    duration: "Duration",
    exercises_done: "Exercises done",
    total_sets: "Total sets",
    completed_sets: "Completed sets",
    edit: "Edit",
    delete: "Delete",
    start: "Start",
    workout_paused: "Workout paused",
    resume_workout: "Resume workout",
    click_to_resume: "Click to resume",
    rest_label: "Rest",
    check_all_exercises: "Check all exercises",
    cannot_finish: "Cannot finish",
    check_all_exercises_to_finish: "Check all exercises in the last round before finishing the workout.",
    confirm_finish_workout: "Finish workout?",
    progress_will_be_saved: "Progress will be saved.",
    rounds_count: "Number of rounds",
    resume_to_continue: "Resume workout to continue",
    wait_for_rest: "Wait for rest",
    rest_in_progress: "Rest in progress...",
    cannot_change_rest: "Cannot change rest during countdown",
    cannot_change_rounds: "Cannot change number of rounds during countdown",
    cannot_reduce_rounds: "Cannot reduce - you are too far into the workout",
    click_finish_to_save: "Click \"Finish workout\" to save",
    round_x_of_y: "Round {0} of {1} - go!",
    rest_x_next_round_y: "Rest {0}s → Round {1}",
    finish_workout_btn: "Finish Workout",
    complete_round: "COMPLETE ROUND",
    complete_workout: "COMPLETE WORKOUT",
    done_count_total: "{0}/{1} done",
    done_count_finish_workout: "{0}/{1} done - FINISH WORKOUT",
    done_count_finish_round: "{0}/{1} done - COMPLETE ROUND",
    database_error: "Database error",
    light_mode: "Light mode",
    stats_info: "Select an exercise to see how your weight changed over time. The chart shows the heaviest weight from each workout for the selected exercise."
  }
};

function t(key, lang = null) {
  const currentLang = lang || localStorage.getItem('gym-lang') || 'pl';
  let text = translations[currentLang]?.[key] || translations['pl'][key] || key;

  // Simple string formatting for {0}, {1}, etc.
  if (arguments.length > 2) {
    for (let i = 2; i < arguments.length; i++) {
      text = text.replace(new RegExp('\\{' + (i - 2) + '\\}', 'g'), arguments[i]);
    }
  }

  return text;
}

function applyTranslations(lang = null) {
  const currentLang = lang || localStorage.getItem('gym-lang') || 'pl';
  document.querySelectorAll('[data-key]').forEach(el => {
    const key = el.getAttribute('data-key');
    if (translations[currentLang]?.[key]) {
      const text = el.textContent;
      const emojiMatch = text.match(/^[\u{1F300}-\u{1F9FF}]/u);
      const prefix = emojiMatch ? emojiMatch[0] + ' ' : '';
      el.textContent = prefix + translations[currentLang][key];
    }
  });

  // Translate placeholders
  document.querySelectorAll('[data-placeholder-key]').forEach(el => {
    const key = el.getAttribute('data-placeholder-key');
    if (translations[currentLang]?.[key]) {
      el.placeholder = translations[currentLang][key];
    }
  });

  const muscleSelect = document.getElementById('ex-muscle');
  if (muscleSelect) {
    Array.from(muscleSelect.options).forEach(opt => {
      const key = MUSCLE_GROUP_MAP[opt.value];
      if (key && translations[currentLang][key]) {
        opt.textContent = translations[currentLang][key];
      }
    });
  }

  const langSelect = document.getElementById('lang-select');
  if (langSelect) {
    Array.from(langSelect.options).forEach(opt => {
      if (opt.value === 'pl') opt.textContent = translations[currentLang].polish || 'Polski';
      if (opt.value === 'en') opt.textContent = translations[currentLang].english || 'English';
    });
  }
}
