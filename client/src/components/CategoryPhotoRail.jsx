import { useNavigate } from "react-router-dom";

const ITEMS = [
  ["Protein", "Protein Powder", "/products/real/protein-powder-1.jpg"],
  ["Bars", "Protein Bar", "/products/real/protein-bar-1.jpg"],
  ["Hydration", "Shaker Bottle", "/products/real/shaker-bottle-1.jpg"],
  ["Cardio", "Jump Rope", "/products/real/jump-rope-1.jpg"],
  ["Strength", "Resistance Bands", "/products/real/resistance-bands-1.jpg"],
  ["Mobility", "Yoga Mat", "/products/real/yoga-mat-1.jpg"],
  ["Recovery", "Foam Roller", "/products/real/foam-roller-1.jpg"],
  ["Wearables", "Fitness Tracker", "/products/real/fitness-tracker-1.jpg"],
];

export default function CategoryPhotoRail() {
  const navigate = useNavigate();

  return (
    <section className="border-y border-[var(--lux-line)] bg-[var(--lux-surface)] py-8 sm:py-10">
      <div className="mx-auto w-[min(1320px,calc(100%_-_32px))]">
        <div className="mb-5 flex items-end justify-between gap-5">
          <div>
            <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-[var(--lux-muted)]">
              SHOP BY ROUTINE
            </p>
            <h2 className="mt-2 font-heading text-2xl font-extrabold tracking-[-0.04em] sm:text-3xl">
              Find your next essential.
            </h2>
          </div>

          <button
            type="button"
            onClick={() => navigate("/shop")}
            className="hidden text-xs font-bold underline underline-offset-4 sm:inline-flex"
          >
            View all
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {ITEMS.map(([label, type, image]) => (
            <button
              key={type}
              type="button"
              onClick={() => navigate(`/shop?type=${encodeURIComponent(type)}`)}
              className="group relative min-w-[190px] flex-1 overflow-hidden rounded-2xl bg-stone-900 text-left sm:min-w-[220px]"
            >
              <img
                src={image}
                alt=""
                aria-hidden="true"
                className="aspect-[4/5] h-full w-full object-cover opacity-85 transition duration-500 motion-safe:group-hover:scale-[1.025]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/55">{type}</p>
                <p className="mt-1 text-lg font-extrabold">{label}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
