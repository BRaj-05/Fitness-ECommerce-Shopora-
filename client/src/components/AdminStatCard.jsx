import { createElement } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useCountUp } from "../hooks/useCountUp";
import { cn } from "../lib/cn";

export default function AdminStatCard({ label, value, format = (number) => Math.round(number).toLocaleString("en-IN"), icon: Icon, hint, accent = "bg-[var(--lux-violet)]", index = 0 }) {
  const count = useCountUp(value);
  const reduceMotion = useReducedMotion();

  return (
    <motion.article initial={reduceMotion ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : 0.24, delay: reduceMotion ? 0 : index * 0.06 }} className="lux-admin-card shopora-lift relative overflow-hidden p-5">
      <span className={cn("absolute inset-x-0 top-0 h-1", accent)} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><p className="lux-eyebrow">{label}</p><p className="font-heading mt-3 truncate text-2xl font-extrabold text-[var(--lux-ink)] sm:text-3xl">{format(count)}</p>{hint && <p className="mt-2 text-xs text-[var(--lux-muted)]">{hint}</p>}</div>
        {Icon && <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--lux-soft)] text-[var(--lux-muted)]">{createElement(Icon, { size: 18, strokeWidth: 1.8 })}</span>}
      </div>
    </motion.article>
  );
}
