import { getWorkoutByDate, saveWorkout } from "./workoutStorage";

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function toLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function dateFromKey(dateKey) {
  const [year, month, day] = String(dateKey).split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

export function addDays(dateKey, amount) {
  const date = dateFromKey(dateKey);
  date.setDate(date.getDate() + amount);
  return toLocalDateKey(date);
}

export function normalizeActivePlan(plan) {
  if (!plan?.name) return null;

  const parsedStart = plan.startedAt ? new Date(plan.startedAt) : new Date();
  const validStart = Number.isNaN(parsedStart.getTime()) ? new Date() : parsedStart;
  const durationWeeks = Math.min(
    104,
    Math.max(1, Number(plan.durationWeeks) || Number.parseInt(plan.duration, 10) || 1),
  );

  return {
    name: String(plan.name),
    focus: String(plan.focus || "Fitness"),
    duration: String(plan.duration || `${durationWeeks} Weeks`),
    durationWeeks,
    difficulty: String(plan.difficulty || ""),
    startDate: DATE_KEY_PATTERN.test(plan.startDate || "")
      ? plan.startDate
      : toLocalDateKey(validStart),
    startedAt: validStart.toISOString(),
  };
}

export function getStoredActivePlan() {
  try {
    return normalizeActivePlan(JSON.parse(localStorage.getItem("shoporaActiveFitnessPlan")));
  } catch {
    return null;
  }
}

export function findActivePlanInLogs(logs = {}) {
  const plans = Object.values(logs)
    .map((log) => normalizeActivePlan(log?.plan))
    .filter(Boolean)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  return plans[0] || null;
}

export async function beginFitnessPlan(plan, focus, persistToAccount = false) {
  const now = new Date();
  const activePlan = normalizeActivePlan({
    ...plan,
    focus,
    startDate: toLocalDateKey(now),
    startedAt: now.toISOString(),
  });

  try {
    localStorage.setItem("shoporaActiveFitnessPlan", JSON.stringify(activePlan));
    localStorage.setItem("selectedDate", activePlan.startDate);
  } catch {
    // Navigation still works when browser storage is unavailable.
  }

  if (persistToAccount) {
    const existing = await getWorkoutByDate(activePlan.startDate);
    const shouldSetTitle = !existing?.title || existing.title === "Logged Workout";
    await saveWorkout({
      date: activePlan.startDate,
      plan: activePlan,
      ...(shouldSetTitle ? { title: `${activePlan.name} - Day 1` } : {}),
    });
  }

  return activePlan;
}

export function getPlanEndDate(plan) {
  const normalized = normalizeActivePlan(plan);
  if (!normalized) return null;
  return addDays(normalized.startDate, normalized.durationWeeks * 7 - 1);
}

export function getPlanDayNumber(dateKey, plan) {
  const normalized = normalizeActivePlan(plan);
  if (!normalized || dateKey < normalized.startDate || dateKey > getPlanEndDate(normalized)) {
    return null;
  }
  const milliseconds = dateFromKey(dateKey) - dateFromKey(normalized.startDate);
  return Math.round(milliseconds / 86_400_000) + 1;
}

export function getPlanDayStatus(dateKey, plan, logs = {}, todayKey = toLocalDateKey()) {
  const dayNumber = getPlanDayNumber(dateKey, plan);
  if (!dayNumber) return null;

  const log = logs[dateKey] || {};
  if (log.checkOutAt) return "completed";
  if (dateKey < todayKey) return "missed";
  if (log.checkInAt) return "in-progress";
  if (dateKey === todayKey) return "pending";
  return "upcoming";
}

export function getPlanStats(plan, logs = {}, todayKey = toLocalDateKey()) {
  const normalized = normalizeActivePlan(plan);
  if (!normalized) return { completed: 0, missed: 0, elapsed: 0, adherence: 0 };

  const endDate = getPlanEndDate(normalized);
  const lastElapsedDate = todayKey < endDate ? todayKey : endDate;
  let completed = 0;
  let missed = 0;
  let elapsed = 0;

  for (let dateKey = normalized.startDate; dateKey <= lastElapsedDate; dateKey = addDays(dateKey, 1)) {
    elapsed += 1;
    const status = getPlanDayStatus(dateKey, normalized, logs, todayKey);
    if (status === "completed") completed += 1;
    if (status === "missed") missed += 1;
  }

  return {
    completed,
    missed,
    elapsed,
    adherence: elapsed ? Math.round((completed / elapsed) * 100) : 0,
  };
}
