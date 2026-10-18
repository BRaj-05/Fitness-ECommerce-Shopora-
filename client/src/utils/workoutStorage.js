import { getAuthHeaders } from "./getAuthHeaders";
import { apiFetch } from "./apiFetch";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * Retrieves all stored workout logs from the backend.
 */
export const getWorkoutLogs = async () => {
  try {
    const headers = await getAuthHeaders();
    const res = await apiFetch(`${API}/api/workouts`, { headers });
    if (!res.ok) throw new Error("Failed to fetch workouts");
    return await res.json();
  } catch (err) {
    console.error(err);
    return {};
  }
};

/**
 * Alias for getWorkoutLogs as requested.
 */
export const getWorkouts = getWorkoutLogs;

/**
 * Retrieves workout data for a specific date (YYYY-MM-DD).
 */
export const getWorkoutByDate = async (date) => {
  const logs = await getWorkoutLogs();
  return logs[date] || null;
};

/**
 * Saves a workout entry.
 * Expects: { date, title, notes, exercises? }
 */
export const saveWorkout = async (entry) => {
  try {
    const headers = await getAuthHeaders();
    const res = await apiFetch(`${API}/api/workouts`, {
      method: "POST",
      headers,
      body: JSON.stringify(entry),
    });
    if (!res.ok) throw new Error("Failed to save workout");
    return await res.json();
  } catch (err) {
    console.error(err);
    return null;
  }
};

/**
 * Removes a workout entry for a date.
 */
export const deleteWorkout = async (date) => {
  try {
    const headers = await getAuthHeaders();
    const res = await apiFetch(`${API}/api/workouts/${date}`, {
      method: "DELETE",
      headers,
    });
    if (!res.ok) throw new Error("Failed to delete workout");
  } catch (err) {
    console.error(err);
  }
};

/**
 * Adds an exercise to a workout for a specific date.
 * Prevents duplicate exercises based on exercise ID.
 * Expects exercise: { id, name, bodyPart, target, equipment, gifUrl }
 */
export const addExerciseToWorkout = async (date, exercise) => {
  const workout = (await getWorkoutByDate(date)) || { date, title: "", notes: "", exercises: [] };
  const exercises = workout.exercises || [];

  if (exercises.some(e => e.id === exercise.id)) {
    console.warn(`Exercise with ID ${exercise.id} already exists in this workout`);
    return;
  }

  exercises.push({
    id: String(exercise.id),
    name: exercise.name,
    bodyPart: exercise.bodyPart || "",
    target: exercise.target || "",
    equipment: exercise.equipment || "",
    gifUrl: exercise.gifUrl || null,
  });
  await saveWorkout({ ...workout, date, exercises });
};

/**
 * Removes an exercise from a workout for a specific date.
 */
export const removeExerciseFromWorkout = async (date, exerciseId) => {
  const workout = await getWorkoutByDate(date);
  if (!workout) return;

  const exercises = (workout.exercises || []).filter(e => e.id !== exerciseId);
  await saveWorkout({ ...workout, date, exercises });
};

/**
 * Formats data specifically for FullCalendar events list.
 */
export const createWorkoutEvents = (logs = {}) => {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return Object.keys(logs)
    .filter(date => {
      const log = logs[date];
      return (log.title && log.title.trim() !== "") ||
             (log.notes && log.notes.trim() !== "") ||
             (log.exercises && log.exercises.length > 0) ||
             (log.checklist && log.checklist.length > 0) ||
             log.checkInAt ||
             log.checkOutAt;
    })
    .map(date => ({
      title: logs[date].title || 'Logged Workout',
      date: date,
      allDay: true,
      extendedProps: {
        status: logs[date].checkOutAt
          ? 'completed'
          : logs[date].checkInAt
            ? date < today ? 'missed' : 'in-progress'
            : 'logged',
      },
    }));
};

export const getAllWorkoutEvents = async () => createWorkoutEvents(await getWorkoutLogs());
