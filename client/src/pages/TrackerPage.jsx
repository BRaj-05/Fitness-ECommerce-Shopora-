// client\src\pages\TrackerPage.jsx

import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion as Motion, useReducedMotion } from "framer-motion";
import Navbar from "../components/Navbar";
import WorkoutCalendar from "../components/WorkoutCalendar";
import SiteFooter from "../components/SiteFooter";
import { Activity, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { getWorkoutLogs } from "../utils/workoutStorage";
import {
  findActivePlanInLogs,
  getStoredActivePlan,
  normalizeActivePlan,
} from "../utils/fitnessPlanTracker";

/**
 * TrackerPage
 * Dedicated page for the fitness calendar.
 * Maintains Shopora's editorial layout and minimalism.
 */
export default function TrackerPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const reduceMotion = useReducedMotion();
  const [activePlan, setActivePlan] = useState(() =>
    normalizeActivePlan(location.state?.activePlan) || getStoredActivePlan(),
  );
  const [logs, setLogs] = useState({});
  const [logsLoading, setLogsLoading] = useState(Boolean(user));

  const loadLogs = useCallback(async () => {
    if (!user) {
      setLogs({});
      setLogsLoading(false);
      return;
    }

    setLogsLoading(true);
    const nextLogs = await getWorkoutLogs();
    setLogs(nextLogs);
    setActivePlan((currentPlan) => currentPlan || findActivePlanInLogs(nextLogs));
    setLogsLoading(false);
  }, [user]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Animation variants
  const fadeUp = {
    hidden: { opacity: 0, y: 28 },
    visible: { opacity: 1, y: 0 }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--lux-bg)] font-sans text-[var(--lux-ink)]">
      <Navbar variant="home" />

      <main className="shopora-wide-shell tracker-page-shell py-10 sm:py-14 lg:py-16">
        {/* Navigation / Header */}
        <Motion.div
          className="tracker-page-header mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <Motion.div variants={fadeUp}>
            <Motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/home")}
              className="mb-7 flex min-h-11 w-fit items-center gap-2 rounded-full border border-[var(--lux-line)] bg-[var(--lux-surface)] px-4 text-xs font-bold uppercase tracking-[0.14em] text-[var(--lux-muted)] transition hover:text-[var(--lux-ink)]"
            >
              <ArrowLeft size={15} />
              <span>Back to Shopora</span>
            </Motion.button>

            <div>
              <Motion.p
                className="text-[10px] sm:text-xs tracking-[0.2em] uppercase text-stone-400 mb-3 font-semibold flex items-center gap-2"
                animate={reduceMotion ? undefined : { opacity: [0.5, 1] }}
                transition={reduceMotion ? undefined : { duration: 1.5, repeat: Infinity }}
              >
                <Motion.span
                  className="grid h-6 w-6 place-items-center rounded-lg bg-[var(--lux-soft)] text-[var(--lux-mint)]"
                  animate={reduceMotion ? undefined : { scale: [1, 1.2, 1] }}
                  transition={reduceMotion ? undefined : { duration: 1.5, repeat: Infinity }}
                ><Activity size={12} /></Motion.span>
                Personal Progress
              </Motion.p>
              <Motion.h1
                className="font-heading text-4xl font-extrabold leading-[1.05] md:text-5xl lg:text-7xl"
                variants={fadeUp}
              >
                Workout tracker
              </Motion.h1>
            </div>
          </Motion.div>

          <Motion.div
            variants={fadeUp}
            transition={{ delay: 0.15 }}
            className="max-w-sm md:text-right flex flex-col md:items-end mt-4 md:mt-0"
          >
            <Motion.p
              className="rounded-2xl border border-[var(--lux-line)] bg-[var(--lux-surface)] p-5 text-sm leading-relaxed text-[var(--lux-muted)]"
              whileHover={{ y: -2, boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}
              transition={{ duration: 0.2 }}
            >
              Plan your sessions, log your PRs, and visualize your consistency in one minimalist view. Every day counts.
            </Motion.p>
            {activePlan && (
              <div className="mt-3 flex w-full items-center gap-3 rounded-xl border border-[color-mix(in_srgb,var(--lux-mint)_30%,transparent)] bg-[color-mix(in_srgb,var(--lux-mint)_8%,var(--lux-surface))] px-4 py-3 text-left">
                <CheckCircle2 className="shrink-0 text-[var(--lux-mint)]" size={18} />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase text-[var(--lux-muted)]">Active plan</p>
                  <p className="truncate text-sm font-bold text-[var(--lux-ink)]">{activePlan.name} / {activePlan.duration}</p>
                  <p className="mt-0.5 text-[11px] text-[var(--lux-muted)]">Started {activePlan.startDate}</p>
                </div>
              </div>
            )}
          </Motion.div>
        </Motion.div>

        {/* The Calendar Component */}
        <Motion.div
          className="tracker-calendar-stage mt-8"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
        >
          <WorkoutCalendar
            activePlan={activePlan}
            logs={logs}
            loading={logsLoading}
            isAuthenticated={Boolean(user)}
            onRefresh={loadLogs}
          />
        </Motion.div>
      </main>
      <SiteFooter />
    </div>
  );
}
