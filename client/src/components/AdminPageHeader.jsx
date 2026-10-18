import { motion, useReducedMotion } from "framer-motion";

export default function AdminPageHeader({ eyebrow, title, description, action }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.header
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.24 }}
      className="mb-8 flex flex-col justify-between gap-5 sm:mb-10 sm:flex-row sm:items-end"
    >
      <div>
        <p className="lux-eyebrow">{eyebrow}</p>
        <h1 className="font-heading mt-2 text-3xl font-extrabold tracking-tight text-[var(--lux-ink)] sm:text-4xl">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--lux-muted)]">{description}</p>}
      </div>
      {action}
    </motion.header>
  );
}
