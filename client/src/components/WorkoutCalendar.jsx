import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  CheckCircle2,
  Clock3,
  LogIn,
  LogOut,
  NotebookPen,
} from "lucide-react";
import { createWorkoutEvents, saveWorkout } from "../utils/workoutStorage";
import {
  getPlanDayNumber,
  getPlanDayStatus,
  getPlanStats,
  normalizeActivePlan,
  toLocalDateKey,
} from "../utils/fitnessPlanTracker";

const STATUS_DETAILS = {
  completed: { label: "Completed", shortLabel: "Done" },
  "in-progress": { label: "Checked in", shortLabel: "In progress" },
  missed: { label: "Missed", shortLabel: "Missed" },
  pending: { label: "Not checked in", shortLabel: "Check in" },
  upcoming: { label: "Upcoming", shortLabel: "" },
};

export default function WorkoutCalendar({
  activePlan,
  logs = {},
  loading = false,
  isAuthenticated = false,
  onRefresh,
}) {
  const navigate = useNavigate();
  const [attendanceAction, setAttendanceAction] = useState("");
  const [attendanceError, setAttendanceError] = useState("");
  const todayKey = toLocalDateKey();
  const plan = useMemo(() => normalizeActivePlan(activePlan), [activePlan]);
  const events = useMemo(() => createWorkoutEvents(logs), [logs]);
  const todayLog = logs[todayKey] || {};
  const todayStatus = plan ? getPlanDayStatus(todayKey, plan, logs, todayKey) : null;
  const dayNumber = plan ? getPlanDayNumber(todayKey, plan) : null;
  const planStats = useMemo(() => getPlanStats(plan, logs, todayKey), [plan, logs, todayKey]);

  const openWorkout = (date = todayKey) => {
    try {
      localStorage.setItem("selectedDate", date);
    } catch {
      // The daily editor can still open if browser storage is restricted.
    }
    navigate("/notes", { state: { date } });
  };

  const handleAttendance = async (action) => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }
    if (!plan || attendanceAction) return;
    if (action === "checkout" && !todayLog.checkInAt) {
      setAttendanceError("Check in before checking out.");
      return;
    }

    setAttendanceError("");
    setAttendanceAction(action);
    const timestamp = new Date().toISOString();
    const saved = await saveWorkout({
      date: todayKey,
      plan,
      title: todayLog.title || `${plan.name} - Day ${dayNumber || 1}`,
      ...(action === "checkin" ? { checkInAt: timestamp } : { checkOutAt: timestamp }),
    });

    if (!saved) {
      setAttendanceError("Could not update attendance. Please try again.");
    } else if (onRefresh) {
      await onRefresh();
    }
    setAttendanceAction("");
  };

  const statusForDate = (date) =>
    plan ? getPlanDayStatus(toLocalDateKey(date), plan, logs, todayKey) : null;

  return (
    <div className="workout-calendar-shell overflow-hidden rounded-2xl border border-[var(--lux-line)] bg-[var(--lux-surface)] p-4 shadow-[var(--lux-shadow)] sm:p-6 lg:p-8">
      <style>{`
        .workout-calendar-shell .fc {
          --fc-page-bg-color: var(--lux-surface);
          --fc-neutral-bg-color: var(--lux-soft);
          --fc-border-color: var(--lux-line);
          --fc-button-bg-color: var(--lux-surface);
          --fc-button-border-color: var(--lux-line);
          --fc-button-hover-bg-color: var(--lux-soft);
          --fc-button-hover-border-color: color-mix(in srgb, var(--lux-ink) 28%, transparent);
          --fc-button-active-bg-color: var(--lux-ink);
          --fc-button-active-border-color: var(--lux-ink);
          --fc-button-text-color: var(--lux-ink);
          --fc-today-bg-color: color-mix(in srgb, var(--lux-mint) 8%, var(--lux-surface));
          color: var(--lux-ink);
          font-family: Inter, system-ui, sans-serif;
        }
        .workout-calendar-shell .fc .fc-toolbar { position:relative; align-items:center; margin-bottom:1.25rem; }
        .workout-calendar-shell .fc .fc-toolbar-chunk:nth-child(2) { position:absolute; left:50%; transform:translateX(-50%); }
        .workout-calendar-shell .fc .fc-toolbar-title {
          color:var(--lux-ink); font-family:Manrope, Inter, sans-serif;
          font-size:clamp(1.05rem, 2vw, 1.45rem); font-weight:800; letter-spacing:0; text-align:center;
        }
        .workout-calendar-shell .fc .fc-button-primary {
          min-height:38px; border-radius:9999px; padding:.5rem .85rem; box-shadow:none;
          color:var(--lux-ink); font-size:.7rem; font-weight:700; letter-spacing:0; text-transform:uppercase;
        }
        .workout-calendar-shell .fc .fc-button-primary:focus-visible {
          box-shadow:0 0 0 3px color-mix(in srgb, var(--lux-violet) 28%, transparent); outline:none;
        }
        .workout-calendar-shell .fc-theme-standard .fc-scrollgrid,
        .workout-calendar-shell .fc-theme-standard th,
        .workout-calendar-shell .fc-theme-standard td { border-color:var(--lux-line); }
        .workout-calendar-shell .fc .fc-col-header-cell { background:var(--lux-soft); }
        .workout-calendar-shell .fc .fc-col-header-cell-cushion {
          padding:.8rem .25rem; color:var(--lux-muted); font-size:.65rem; font-weight:800;
          letter-spacing:.08em; text-decoration:none; text-transform:uppercase;
        }
        .workout-calendar-shell .fc .fc-daygrid-day {
          background:var(--lux-surface); cursor:pointer; transition:background-color 160ms ease;
        }
        .workout-calendar-shell .fc .fc-daygrid-day:hover { background:color-mix(in srgb, var(--lux-violet) 7%, var(--lux-surface)); }
        .workout-calendar-shell .fc .fc-day-other { background:color-mix(in srgb, var(--lux-soft) 55%, var(--lux-surface)); }
        .workout-calendar-shell .fc .fc-daygrid-day-number {
          padding:.65rem; color:var(--lux-muted); font-size:.76rem; font-weight:650; text-decoration:none;
        }
        .workout-calendar-shell .fc .fc-day-other .fc-daygrid-day-number { opacity:.48; }
        .workout-calendar-shell .fc .fc-day-today { background:var(--fc-today-bg-color) !important; box-shadow:inset 0 3px 0 var(--lux-mint); }
        .workout-calendar-shell .fc .fc-day-today .fc-daygrid-day-number { color:var(--lux-ink); font-weight:800; }
        .workout-calendar-shell .fc td.shopora-plan-day--completed {
          background:color-mix(in srgb, var(--lux-mint) 18%, var(--lux-surface)) !important;
          box-shadow:inset 0 0 0 2px color-mix(in srgb, var(--lux-mint) 68%, transparent);
        }
        .workout-calendar-shell .fc td.shopora-plan-day--in-progress {
          background:color-mix(in srgb, var(--lux-orange) 14%, var(--lux-surface)) !important;
          box-shadow:inset 0 0 0 2px color-mix(in srgb, var(--lux-orange) 58%, transparent);
        }
        .workout-calendar-shell .fc td.shopora-plan-day--pending,
        .workout-calendar-shell .fc td.shopora-plan-day--missed {
          background:color-mix(in srgb, #ef4444 13%, var(--lux-surface)) !important;
          box-shadow:inset 0 0 0 2px color-mix(in srgb, #ef4444 58%, transparent);
        }
        .workout-calendar-shell .fc td.shopora-plan-day--missed { background:color-mix(in srgb, #ef4444 19%, var(--lux-surface)) !important; }
        .workout-calendar-shell .fc td.shopora-plan-day--upcoming { box-shadow:inset 0 0 0 1px color-mix(in srgb, var(--lux-violet) 20%, transparent); }
        .shopora-calendar-day { display:flex; min-height:28px; flex-direction:column; align-items:flex-end; gap:3px; padding:.42rem; }
        .shopora-calendar-day-number { color:var(--lux-muted); font-size:.76rem; font-weight:750; }
        .shopora-calendar-status { max-width:100%; overflow:hidden; color:var(--lux-ink); font-size:.58rem; font-weight:800; text-overflow:ellipsis; text-transform:uppercase; white-space:nowrap; }
        .workout-calendar-shell .fc .fc-event {
          margin:3px 5px; border:0; border-radius:7px; background:var(--lux-violet); box-shadow:none;
          color:#fff; cursor:pointer; font-size:.68rem; font-weight:700; padding:.24rem .45rem;
        }
        .workout-calendar-shell .fc .shopora-workout-event--completed { background:#087f6c; }
        .workout-calendar-shell .fc .shopora-workout-event--in-progress { background:#c2410c; }
        .workout-calendar-shell .fc .shopora-workout-event--missed { background:#b91c1c; }
        .workout-calendar-shell .is-loading .fc { opacity:.55; pointer-events:none; }
        @media (max-width:640px) {
          .workout-calendar-shell .fc .fc-toolbar { align-items:stretch; flex-direction:column-reverse; gap:.9rem; }
          .workout-calendar-shell .fc .fc-toolbar-chunk:first-child { display:flex; justify-content:center; }
          .workout-calendar-shell .fc .fc-toolbar-chunk:nth-child(2) { position:static; transform:none; }
          .shopora-calendar-day { min-height:22px; padding:.3rem; }
          .shopora-calendar-day-number { font-size:.66rem; }
          .shopora-calendar-status { width:7px; height:7px; border-radius:999px; background:currentColor; font-size:0; }
          .workout-calendar-shell .fc .fc-col-header-cell-cushion { padding-block:.65rem; font-size:.58rem; }
        }
        @media (prefers-reduced-motion:reduce) {
          .workout-calendar-shell .fc .fc-daygrid-day { transition:none; }
        }
      `}</style>

      {plan && (
        <section className="mb-6 grid gap-5 rounded-xl border border-[var(--lux-line)] bg-[var(--lux-surface-2)] p-4 sm:p-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`tracker-status-badge tracker-status-badge--${todayStatus}`}>
                {todayStatus === "completed" ? <CheckCircle2 size={14} /> : <Clock3 size={14} />}
                {STATUS_DETAILS[todayStatus]?.label || "Plan day"}
              </span>
              <span className="text-xs font-bold text-[var(--lux-muted)]">Day {dayNumber || 1} of {plan.durationWeeks * 7}</span>
            </div>
            <h2 className="mt-3 truncate font-heading text-xl font-extrabold text-[var(--lux-ink)]">{plan.name}</h2>
            <p className="mt-1 text-sm text-[var(--lux-muted)]">
              {planStats.completed} completed / {planStats.missed} missed / {planStats.adherence}% adherence
            </p>
            {attendanceError && <p className="mt-3 text-sm font-semibold text-red-600" role="alert">{attendanceError}</p>}
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            {!isAuthenticated ? (
              <button type="button" onClick={() => navigate("/auth")} className="shopora-btn shopora-btn-primary">
                <LogIn size={16} /> Sign in to check in
              </button>
            ) : todayStatus === "completed" ? (
              <button type="button" disabled className="shopora-btn shopora-btn-primary opacity-70">
                <CheckCircle2 size={16} /> Day completed
              </button>
            ) : todayLog.checkInAt ? (
              <button type="button" onClick={() => handleAttendance("checkout")} disabled={Boolean(attendanceAction)} className="shopora-btn shopora-btn-primary">
                <LogOut size={16} /> {attendanceAction === "checkout" ? "Checking out..." : "Check out"}
              </button>
            ) : (
              <button type="button" onClick={() => handleAttendance("checkin")} disabled={Boolean(attendanceAction)} className="shopora-btn shopora-btn-primary">
                <LogIn size={16} /> {attendanceAction === "checkin" ? "Checking in..." : "Check in now"}
              </button>
            )}
            <button type="button" onClick={() => openWorkout(todayKey)} className="shopora-btn shopora-btn-secondary">
              <NotebookPen size={16} /> Daily log
            </button>
          </div>
        </section>
      )}

      <div className={loading ? "is-loading" : ""} aria-busy={loading}>
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          initialDate={todayKey}
          headerToolbar={{ left: "prev,next today", center: "title", right: "" }}
          events={events}
          dateClick={(info) => openWorkout(info.dateStr)}
          eventClick={(info) => openWorkout(info.event.startStr.split("T")[0])}
          eventClassNames={(info) => [`shopora-workout-event--${info.event.extendedProps.status || "logged"}`]}
          dayCellClassNames={(info) => {
            const status = statusForDate(info.date);
            return status ? [`shopora-plan-day--${status}`] : [];
          }}
          dayCellContent={(info) => {
            const status = statusForDate(info.date);
            return (
              <div className="shopora-calendar-day">
                <span className="shopora-calendar-day-number">{info.dayNumberText}</span>
                {status && STATUS_DETAILS[status]?.shortLabel && (
                  <span className="shopora-calendar-status">{STATUS_DETAILS[status].shortLabel}</span>
                )}
              </div>
            );
          }}
          height="auto"
          aspectRatio={1.45}
          dayMaxEventRows={2}
          selectable
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-[var(--lux-line)] pt-5 text-[10px] font-bold uppercase text-[var(--lux-muted)]">
        <span className="tracker-legend"><i className="bg-[var(--lux-mint)]" /> Completed</span>
        <span className="tracker-legend"><i className="bg-[var(--lux-orange)]" /> Checked in</span>
        <span className="tracker-legend"><i className="bg-red-500" /> Missed / pending</span>
        <span className="tracker-legend"><i className="bg-[var(--lux-violet)]" /> Upcoming</span>
        <span className="ml-auto hidden sm:inline">Saved to your Shopora account</span>
      </div>
    </div>
  );
}
