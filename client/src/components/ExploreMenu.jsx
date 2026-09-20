import {
  useEffect,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

const GROUPS = [
  {
    title: "TRAIN",
    items: [
      ["Weight Loss", "/plans/weight-loss"],
      ["Muscle Building", "/plans/muscle-building"],
      ["Mobility & Recovery", "/plans/mobility-recovery"],
      ["Workout Tracker", "/tracker"],
    ],
  },
  {
    title: "TOOLS",
    items: [
      ["Health Tools", "/home#health-tools"],
      ["BMI + TDEE", "/home#health-tools"],
      ["Membership", "/home#membership"],
      ["Rewards", "/profile"],
    ],
  },
  {
    title: "SHOP",
    items: [
      ["All Products", "/shop"],
      ["My Profile", "/profile"],
      ["Orders", "/profile"],
    ],
  },
];

export default function ExploreMenu() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (
        rootRef.current &&
        !rootRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener(
      "pointerdown",
      onPointerDown,
    );

    return () =>
      document.removeEventListener(
        "pointerdown",
        onPointerDown,
      );
  }, []);

  const go = (route) => {
    setOpen(false);
    navigate(route);
  };

  return (
    <div
      ref={rootRef}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label="Explore Shopora"
        aria-expanded={open}
        onClick={() =>
          setOpen((current) => !current)
        }
        className="grid h-10 w-10 place-items-center rounded-xl border border-stone-200 bg-white text-stone-700 transition hover:bg-stone-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
      >
        <span className="grid gap-[3px]">
          <span className="block h-[2px] w-4 rounded-full bg-current" />
          <span className="block h-[2px] w-4 rounded-full bg-current" />
          <span className="block h-[2px] w-4 rounded-full bg-current" />
        </span>
      </button>

      {open && (
        <div className="absolute left-1/2 top-[calc(100%+10px)] z-[1000] w-[min(720px,calc(100vw-32px))] -translate-x-1/2 rounded-3xl border border-stone-200 bg-white p-5 shadow-2xl shadow-stone-950/10 dark:border-slate-700 dark:bg-slate-900">
          <div className="grid gap-5 sm:grid-cols-3">
            {GROUPS.map((group) => (
              <div key={group.title}>
                <p className="px-2 text-[9px] font-bold uppercase tracking-[0.18em] text-stone-400">
                  {group.title}
                </p>

                <div className="mt-2 grid gap-1">
                  {group.items.map(
                    ([label, route]) => (
                      <button
                        key={`${label}-${route}`}
                        type="button"
                        onClick={() => go(route)}
                        className="rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-stone-700 transition hover:bg-stone-100 hover:text-stone-950 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
                      >
                        {label}
                      </button>
                    ),
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
