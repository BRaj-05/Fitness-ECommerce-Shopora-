import {
  OWNER_GITHUB,
  OWNER_LINKEDIN,
  OWNER_NAME,
} from "../config/app";
import { Link } from "react-router-dom";

function ExternalIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M14 5h5v5" />
      <path d="M10 14 19 5" />
      <path d="M19 13v6H5V5h6" />
    </svg>
  );
}

export default function CreatorCredit({ compact = false, className = "" }) {
  return (
    <div
      className={`flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-slate-500 dark:text-slate-400 ${className}`}
    >
      <span>
        Shopora &middot; Project by{" "}
        <strong className="font-semibold text-slate-700 dark:text-slate-200">
          {OWNER_NAME}
        </strong>
      </span>

      {!compact && (
        <>
          <span
            className="hidden h-3 w-px bg-slate-300 dark:bg-slate-700 sm:block"
            aria-hidden="true"
          />

          <a
            href={OWNER_LINKEDIN}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-medium transition hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            LinkedIn <ExternalIcon />
          </a>

          <a
            href={OWNER_GITHUB}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-medium transition hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            GitHub <ExternalIcon />
          </a>

          <a href="https://www.pexels.com/" target="_blank" rel="noreferrer" className="font-medium transition hover:text-indigo-600 dark:hover:text-indigo-400">
            Photos from Pexels
          </a>

          <Link to="/credits" className="font-medium transition hover:text-indigo-600 dark:hover:text-indigo-400">
            Photo credits
          </Link>
        </>
      )}
    </div>
  );
}
