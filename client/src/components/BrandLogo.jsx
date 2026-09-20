import { useNavigate } from "react-router-dom";

export function BrandMark({
  size = 38,
  className = "",
}) {
  return (
    <img
      src="/shopora-mark.svg"
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
    />
  );
}

export default function BrandLogo({
  compact = false,
  className = "",
}) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate("/")}
      aria-label="Shopora home"
      className={`group inline-flex items-center gap-3 ${className}`}
    >
      <BrandMark
        size={compact ? 34 : 40}
        className="transition duration-300 group-hover:-rotate-3 group-hover:scale-[1.04]"
      />

      {!compact && (
        <span className="font-heading text-[20px] font-extrabold tracking-[-0.035em] text-[var(--lux-ink)]">
          Shopora
        </span>
      )}
    </button>
  );
}
