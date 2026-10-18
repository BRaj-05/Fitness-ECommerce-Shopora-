import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  Dumbbell,
  LogIn,
  LogOut,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import Navbar from "../components/Navbar";
import SiteFooter from "../components/SiteFooter";
import { useAuth } from "../auth/useAuth";
import { getWorkoutByDate, saveWorkout } from "../utils/workoutStorage";
import {
  getPlanDayNumber,
  getStoredActivePlan,
  normalizeActivePlan,
  toLocalDateKey,
} from "../utils/fitnessPlanTracker";

const createChecklistId = () =>
  globalThis.crypto?.randomUUID?.() || `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function NotesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [date, setDate] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [exercises, setExercises] = useState([]);
  const [checklist, setChecklist] = useState([]);
  const [checklistText, setChecklistText] = useState("");
  const [checkInAt, setCheckInAt] = useState(null);
  const [checkOutAt, setCheckOutAt] = useState(null);
  const [plan, setPlan] = useState(() => getStoredActivePlan());
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [imageErrors, setImageErrors] = useState(new Set());

  const todayKey = toLocalDateKey();
  const isToday = date === todayKey;
  const planDayNumber = useMemo(() => getPlanDayNumber(date, plan), [date, plan]);

  useEffect(() => {
    let active = true;
    const selectedDate = location.state?.date || localStorage.getItem("selectedDate");
    if (!selectedDate) {
      setError("No date selected. Choose a day from the tracker first.");
      setLoading(false);
      return undefined;
    }

    setDate(selectedDate);
    if (!user) {
      const storedPlan = getStoredActivePlan();
      if (storedPlan && getPlanDayNumber(selectedDate, storedPlan)) {
        setPlan(storedPlan);
        setTitle(`${storedPlan.name} - Day ${getPlanDayNumber(selectedDate, storedPlan)}`);
      }
      setLoading(false);
      return undefined;
    }

    getWorkoutByDate(selectedDate).then((workout) => {
      if (!active) return;
      const resolvedPlan = normalizeActivePlan(workout?.plan) || getStoredActivePlan();
      const dayNumber = getPlanDayNumber(selectedDate, resolvedPlan);
      setPlan(resolvedPlan);
      setTitle(workout?.title || (dayNumber ? `${resolvedPlan.name} - Day ${dayNumber}` : ""));
      setNotes(workout?.notes || "");
      setExercises(workout?.exercises || []);
      setChecklist(workout?.checklist || []);
      setCheckInAt(workout?.checkInAt || null);
      setCheckOutAt(workout?.checkOutAt || null);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [location.state?.date, user]);

  const formattedDate = date
    ? new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  const attendanceStatus = checkOutAt
    ? "completed"
    : date && date < todayKey
      ? "missed"
      : checkInAt
        ? "in-progress"
        : "pending";

  const formatTime = (value) =>
    value
      ? new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "Not recorded";

  const persist = async (overrides = {}) => {
    if (!user) {
      setActionError("Sign in to save attendance and daily work.");
      return null;
    }

    setSaving(true);
    setSaved(false);
    setActionError("");
    const safeTitle = (overrides.title ?? title).trim() || plan?.name || "Daily workout";
    const entry = {
      date,
      title: safeTitle,
      notes: overrides.notes ?? notes,
      exercises: overrides.exercises ?? exercises,
      checklist: overrides.checklist ?? checklist,
      checkInAt: overrides.checkInAt ?? checkInAt,
      checkOutAt: overrides.checkOutAt ?? checkOutAt,
      plan: normalizeActivePlan(overrides.plan ?? plan),
    };
    const result = await saveWorkout(entry);
    setSaving(false);

    if (!result) {
      setActionError("Could not save this day. Please try again.");
      return null;
    }

    setTitle(safeTitle);
    setSaved(true);
    return result;
  };

  const handleCheckIn = async () => {
    if (!isToday) {
      setActionError("Attendance can only be recorded for today.");
      return;
    }
    const timestamp = new Date().toISOString();
    if (await persist({ checkInAt: timestamp })) setCheckInAt(timestamp);
  };

  const handleCheckOut = async () => {
    if (!isToday) {
      setActionError("Attendance can only be recorded for today.");
      return;
    }
    if (!checkInAt) {
      setActionError("Check in before checking out.");
      return;
    }
    const timestamp = new Date().toISOString();
    if (await persist({ checkOutAt: timestamp })) setCheckOutAt(timestamp);
  };

  const updateChecklist = async (nextChecklist) => {
    if (saving) return;
    setChecklist(nextChecklist);
    await persist({ checklist: nextChecklist });
  };

  const handleAddChecklistItem = async (event) => {
    event.preventDefault();
    const text = checklistText.trim();
    if (!text) return;
    const nextChecklist = [
      ...checklist,
      { id: createChecklistId(), text: text.slice(0, 160), completed: false },
    ];
    setChecklistText("");
    await updateChecklist(nextChecklist);
  };

  const handleAddExercise = async () => {
    const result = await persist();
    if (!result) return;

    const combinedText = `${title} ${notes}`.toLowerCase();
    let suggestedCategory = "chest";
    if (combinedText.includes("back") || combinedText.includes("pull") || combinedText.includes("lat")) suggestedCategory = "back";
    else if (combinedText.includes("leg") || combinedText.includes("squat") || combinedText.includes("lower")) suggestedCategory = "legs";
    else if (combinedText.includes("arm") || combinedText.includes("bicep") || combinedText.includes("tricep")) suggestedCategory = "arms";
    else if (combinedText.includes("shoulder") || combinedText.includes("delt")) suggestedCategory = "shoulders";
    else if (combinedText.includes("abs") || combinedText.includes("core")) suggestedCategory = "abs";
    else if (combinedText.includes("cardio") || combinedText.includes("run")) suggestedCategory = "cardio";

    localStorage.setItem("selectedDate", date);
    navigate("/exercises", { state: { suggestedCategory } });
  };

  const handleRemoveExercise = async (exerciseId) => {
    const nextExercises = exercises.filter((exercise) => exercise.id !== exerciseId);
    setExercises(nextExercises);
    await persist({ exercises: nextExercises });
  };

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--lux-bg)] p-6">
        <div className="lux-admin-card w-full max-w-md p-10 text-center">
          <Dumbbell className="mx-auto mb-4 text-[var(--lux-muted)]" size={30} />
          <p className="mb-6 font-medium text-[var(--lux-ink)]">{error}</p>
          <button onClick={() => navigate("/tracker")} className="shopora-btn shopora-btn-primary w-full">
            <ArrowLeft size={15} /> Back to tracker
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--lux-bg)] font-sans text-[var(--lux-ink)]">
      <Navbar variant="product" />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16 lg:px-10">
        <button onClick={() => navigate("/tracker")} className="mb-9 flex min-h-11 items-center gap-2 text-xs font-bold uppercase text-[var(--lux-muted)] transition-colors hover:text-[var(--lux-ink)]">
          <ArrowLeft size={15} /> Back to calendar
        </button>

        <div className="lux-admin-card overflow-hidden">
          <header className="border-b border-[var(--lux-line)] p-6 sm:p-8 md:p-10">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <p className="lux-eyebrow">Daily training log</p>
                <h1 className="mt-2 font-heading text-2xl font-extrabold sm:text-3xl md:text-4xl">{formattedDate}</h1>
                {planDayNumber && <p className="mt-2 text-sm text-[var(--lux-muted)]">{plan.name} / Day {planDayNumber}</p>}
              </div>
              <span className={`tracker-status-badge tracker-status-badge--${attendanceStatus}`}>
                {attendanceStatus === "completed" ? <CheckCircle2 size={15} /> : <Clock3 size={15} />}
                {attendanceStatus === "completed" ? "Completed" : attendanceStatus === "in-progress" ? "Checked in" : attendanceStatus === "missed" ? "Missed" : "Not checked in"}
              </span>
            </div>
          </header>

          <div className="space-y-8 p-6 sm:p-8 md:p-10">
            {!user && (
              <div className="flex flex-col justify-between gap-4 rounded-xl border border-red-500/25 bg-red-500/8 p-4 sm:flex-row sm:items-center">
                <p className="text-sm font-semibold">Sign in to save attendance, notes, and checklist progress.</p>
                <button type="button" onClick={() => navigate("/auth")} className="shopora-btn shopora-btn-primary"><LogIn size={16} /> Sign in</button>
              </div>
            )}

            <section className="grid gap-4 rounded-xl border border-[var(--lux-line)] bg-[var(--lux-surface-2)] p-5 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <p className="text-xs font-bold uppercase text-[var(--lux-muted)]">Attendance</p>
                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                  <span><strong>Check-in:</strong> {formatTime(checkInAt)}</span>
                  <span><strong>Check-out:</strong> {formatTime(checkOutAt)}</span>
                </div>
                {!isToday && <p className="mt-2 text-xs text-[var(--lux-muted)]">Past and future days can be planned, but attendance is recorded only on the current day.</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                {!checkInAt ? (
                  <button type="button" onClick={handleCheckIn} disabled={saving || !isToday} className="shopora-btn shopora-btn-primary"><LogIn size={16} /> Check in</button>
                ) : !checkOutAt ? (
                  <button type="button" onClick={handleCheckOut} disabled={saving || !isToday} className="shopora-btn shopora-btn-primary"><LogOut size={16} /> Check out</button>
                ) : (
                  <button type="button" disabled className="shopora-btn shopora-btn-primary opacity-70"><CheckCircle2 size={16} /> Complete</button>
                )}
              </div>
            </section>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase text-[var(--lux-muted)]">Workout title</label>
              <input type="text" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Upper body strength" className="w-full border-b border-[var(--lux-line)] bg-transparent py-3 font-heading text-2xl font-extrabold text-[var(--lux-ink)] outline-none transition-colors placeholder:text-[var(--lux-muted)] focus:border-[var(--lux-violet)] sm:text-3xl" />
            </div>

            <section>
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase text-[var(--lux-muted)]">Daily checklist</p>
                  <p className="mt-1 text-sm text-[var(--lux-muted)]">Break the session into clear, finishable actions.</p>
                </div>
                <span className="text-xs font-bold text-[var(--lux-muted)]">{checklist.filter((item) => item.completed).length}/{checklist.length}</span>
              </div>
              <form onSubmit={handleAddChecklistItem} className="flex gap-2">
                <input value={checklistText} onChange={(event) => setChecklistText(event.target.value)} maxLength={160} placeholder="Add warm-up, sets, water, recovery..." className="min-h-11 flex-1 rounded-xl border border-[var(--lux-line)] bg-[var(--lux-surface)] px-4 text-sm text-[var(--lux-ink)] outline-none focus:border-[var(--lux-violet)]" />
                <button type="submit" disabled={!checklistText.trim() || saving} className="shopora-btn shopora-btn-secondary px-4" aria-label="Add checklist item"><Plus size={18} /></button>
              </form>
              <div className="mt-4 space-y-2">
                {checklist.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[var(--lux-line)] p-6 text-center text-sm text-[var(--lux-muted)]">No tasks yet. Add the first action for this day.</div>
                ) : checklist.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-xl border border-[var(--lux-line)] bg-[var(--lux-surface)] px-4 py-3">
                    <button type="button" disabled={saving} onClick={() => updateChecklist(checklist.map((entry) => entry.id === item.id ? { ...entry, completed: !entry.completed } : entry))} className="shrink-0 text-[var(--lux-mint)] disabled:opacity-50" aria-label={item.completed ? `Mark ${item.text} incomplete` : `Mark ${item.text} complete`}>
                      {item.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                    </button>
                    <span className={`flex-1 text-sm ${item.completed ? "text-[var(--lux-muted)] line-through" : "font-semibold text-[var(--lux-ink)]"}`}>{item.text}</span>
                    <button type="button" disabled={saving} onClick={() => updateChecklist(checklist.filter((entry) => entry.id !== item.id))} className="text-[var(--lux-muted)] hover:text-red-500 disabled:opacity-50" aria-label={`Remove ${item.text}`}><X size={17} /></button>
                  </div>
                ))}
              </div>
            </section>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase text-[var(--lux-muted)]">Workout notes</label>
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Record sets, reps, weights, energy, pain, wins, or changes for tomorrow..." rows={7} className="w-full resize-y rounded-xl border border-[var(--lux-line)] bg-[var(--lux-surface)] px-5 py-4 text-sm leading-7 text-[var(--lux-ink)] outline-none transition-colors placeholder:text-[var(--lux-muted)] focus:border-[var(--lux-violet)]" />
            </div>

            {exercises.length > 0 && (
              <section>
                <p className="mb-4 text-xs font-bold uppercase text-[var(--lux-muted)]">Selected exercises ({exercises.length})</p>
                <div className="grid gap-4 md:grid-cols-2">
                  {exercises.map((exercise) => (
                    <div key={exercise.id} className="flex overflow-hidden rounded-xl border border-[var(--lux-line)] bg-[var(--lux-surface)]">
                      <div className="grid w-28 shrink-0 place-items-center bg-[var(--lux-soft)]">
                        {exercise.gifUrl && !imageErrors.has(exercise.id) ? <img src={exercise.gifUrl} alt={exercise.name} className="h-full w-full object-cover" onError={() => setImageErrors((current) => new Set([...current, exercise.id]))} /> : <Dumbbell className="text-[var(--lux-muted)]" size={24} />}
                      </div>
                      <div className="min-w-0 flex-1 p-4">
                        <h3 className="truncate font-heading font-extrabold capitalize">{exercise.name}</h3>
                        <p className="mt-1 text-xs capitalize text-[var(--lux-muted)]">{exercise.target || exercise.bodyPart || "Movement"}</p>
                        <button type="button" onClick={() => handleRemoveExercise(exercise.id)} className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[var(--lux-muted)] hover:text-red-500"><Trash2 size={14} /> Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={handleAddExercise} disabled={saving || loading} className="shopora-btn shopora-btn-secondary w-full"><Plus size={16} /> Add exercise</button>
              <button type="button" onClick={() => persist()} disabled={saving || loading} className="shopora-btn shopora-btn-primary w-full">
                {saving ? <><Clock3 size={16} /> Saving...</> : saved ? <><Check size={16} /> Saved</> : <><Save size={16} /> Save daily log</>}
              </button>
            </div>

            {actionError && <p className="text-center text-sm font-semibold text-red-600" role="alert">{actionError}</p>}
            {saved && <p className="text-center text-xs font-bold uppercase text-[var(--lux-mint)]" aria-live="polite">Daily progress saved</p>}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
