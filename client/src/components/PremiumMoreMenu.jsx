import {
  useEffect,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

const GROUPS = [
  {
    eyebrow: "TRAIN",
    items: [
      {
        title: "Weight Loss",
        subtitle: "12-week structured plan",
        route: "/plans/weight-loss",
      },
      {
        title: "Muscle Building",
        subtitle: "Strength and progression",
        route: "/plans/muscle-building",
      },
      {
        title: "Mobility & Recovery",
        subtitle: "Movement and recovery",
        route: "/plans/mobility-recovery",
      },
    ],
  },
  {
    eyebrow: "ACCOUNT",
    items: [
      {
        title: "Membership",
        subtitle: "Starter, Pro and Elite",
        route: "/home#membership",
      },
      {
        title: "Rewards",
        subtitle: "Points and purchase history",
        route: "/profile",
      },
      {
        title: "Profile",
        subtitle: "Personal info and addresses",
        route: "/profile",
      },
      {
        title: "Orders",
        subtitle: "Purchases and invoices",
        route: "/profile",
      },
    ],
  },
];

export default function PremiumMoreMenu() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const regionRef = useRef(null);
  const closeTimerRef = useRef(null);

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setOpen(false);
    }, 180);
  };

  useEffect(() => {
    const onPointerDown = (event) => {
      if (
        open &&
        regionRef.current &&
        !regionRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      clearCloseTimer();
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const go = (route) => {
    setOpen(false);
    navigate(route);
  };

  return (
    <div
      ref={regionRef}
      className="relative"
      onMouseEnter={clearCloseTimer}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={`lux-nav-link inline-flex items-center gap-2 ${
          open ? "lux-nav-link-active" : ""
        }`}
      >
        More

        <svg
          viewBox="0 0 16 16"
          className={`h-3.5 w-3.5 transition duration-200 ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        >
          <path
            d="M4 6l4 4 4-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <>
          <div className="absolute left-1/2 top-full h-4 w-28 -translate-x-1/2" />

          <div
            role="menu"
            className="lux-mega-menu absolute left-1/2 top-[calc(100%+14px)] z-[1200] w-[min(680px,calc(100vw-32px))] -translate-x-1/2 overflow-hidden"
          >
            <div className="grid gap-0 md:grid-cols-2">
              {GROUPS.map((group) => (
                <section key={group.eyebrow} className="p-5 sm:p-6">
                  <p className="lux-eyebrow">{group.eyebrow}</p>

                  <div className="mt-3 grid gap-1">
                    {group.items.map((item) => (
                      <button
                        key={item.title}
                        type="button"
                        role="menuitem"
                        onClick={() => go(item.route)}
                        className="lux-mega-item group"
                      >
                        <span>
                          <span className="block text-sm font-bold text-[var(--lux-ink)]">
                            {item.title}
                          </span>

                          <span className="mt-0.5 block text-[11px] text-[var(--lux-muted)]">
                            {item.subtitle}
                          </span>
                        </span>

                        <span
                          className="translate-x-0 text-[var(--lux-muted)] transition group-hover:translate-x-1 group-hover:text-[var(--lux-ink)]"
                          aria-hidden="true"
                        >
                          →
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-[var(--lux-line)] bg-[var(--lux-soft)] px-5 py-3 text-[11px] text-[var(--lux-muted)]">
              <span>Quick Find remains available with Ctrl/Cmd + K.</span>

              <button
                type="button"
                onClick={() => go("/shop")}
                className="font-bold text-[var(--lux-ink)]"
              >
                Browse store →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
