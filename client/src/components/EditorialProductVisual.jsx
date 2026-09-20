const THEMES = {
  "Protein Powder": {
    bg: "#EDE7DD",
    ink: "#171717",
    accent: "#FF5C35",
    accent2: "#12BFA3",
    label: "PROTEIN",
  },
  "Protein Bar": {
    bg: "#F2E4DE",
    ink: "#171717",
    accent: "#8E3D31",
    accent2: "#FF9A5A",
    label: "BAR",
  },
  "Jump Rope": {
    bg: "#E7EDF8",
    ink: "#101319",
    accent: "#5748D8",
    accent2: "#82A8FF",
    label: "ROPE",
  },
  "Resistance Bands": {
    bg: "#DCEFED",
    ink: "#101319",
    accent: "#087C70",
    accent2: "#9C5CFF",
    label: "BANDS",
  },
  "Fitness Tracker": {
    bg: "#E9E8F3",
    ink: "#111319",
    accent: "#222735",
    accent2: "#D6FF50",
    label: "TRACK",
  },
};

function PowderArt({ theme }) {
  return (
    <>
      <ellipse cx="200" cy="300" rx="95" ry="20" fill="rgba(0,0,0,.12)" />
      <rect x="125" y="100" width="150" height="190" rx="30" fill={theme.ink} />
      <rect x="138" y="80" width="124" height="40" rx="14" fill={theme.accent} />
      <rect x="145" y="148" width="110" height="80" rx="15" fill="#F8F5EE" />
      <path d="M150 190c30-28 64 28 100-3" stroke={theme.accent2} strokeWidth="10" strokeLinecap="round" />
      <text x="200" y="175" textAnchor="middle" fill={theme.ink} fontSize="11" fontWeight="800" letterSpacing="3">SHOPORA</text>
    </>
  );
}

function BarArt({ theme }) {
  return (
    <>
      <ellipse cx="200" cy="275" rx="120" ry="18" fill="rgba(0,0,0,.10)" />
      <g transform="rotate(-8 200 190)">
        <rect x="77" y="145" width="246" height="90" rx="24" fill={theme.ink} />
        <path d="M90 145h70l-35 90H90z" fill={theme.accent} />
        <path d="M270 145h43v90h-78z" fill={theme.accent2} />
        <text x="205" y="184" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="800" letterSpacing="3">SHOPORA</text>
        <text x="205" y="205" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="700" letterSpacing="2">PROTEIN BAR</text>
      </g>
    </>
  );
}

function RopeArt({ theme }) {
  return (
    <>
      <path d="M126 115c98-60 164 25 137 91-19 47-87 40-99-6-13-48 31-84 82-64" fill="none" stroke={theme.accent} strokeWidth="13" strokeLinecap="round" />
      <rect x="104" y="95" width="35" height="90" rx="17" transform="rotate(-24 104 95)" fill={theme.ink} />
      <rect x="267" y="93" width="35" height="90" rx="17" transform="rotate(24 267 93)" fill={theme.ink} />
      <circle cx="200" cy="205" r="10" fill={theme.accent2} />
    </>
  );
}

function BandsArt({ theme }) {
  return (
    <>
      <ellipse cx="200" cy="170" rx="110" ry="56" fill="none" stroke={theme.accent} strokeWidth="18" />
      <ellipse cx="200" cy="205" rx="87" ry="43" fill="none" stroke={theme.accent2} strokeWidth="15" />
      <ellipse cx="200" cy="236" rx="64" ry="31" fill="none" stroke={theme.ink} strokeWidth="12" />
    </>
  );
}

function TrackerArt({ theme }) {
  return (
    <>
      <rect x="170" y="62" width="60" height="95" rx="26" fill={theme.ink} />
      <rect x="147" y="133" width="106" height="118" rx="34" fill={theme.ink} />
      <rect x="160" y="146" width="80" height="92" rx="25" fill="#0D1016" stroke={theme.accent2} strokeWidth="3" />
      <path d="M176 196h14l9-22 12 39 9-17h12" fill="none" stroke={theme.accent2} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="170" y="228" width="60" height="95" rx="26" fill={theme.ink} />
    </>
  );
}

export default function EditorialProductVisual({ product, className = "" }) {
  const theme = THEMES[product?.type] || THEMES["Fitness Tracker"];
  let Art = TrackerArt;

  if (product?.type === "Protein Powder") Art = PowderArt;
  else if (product?.type === "Protein Bar") Art = BarArt;
  else if (product?.type === "Jump Rope") Art = RopeArt;
  else if (product?.type === "Resistance Bands") Art = BandsArt;

  return (
    <div className={`relative h-full w-full overflow-hidden ${className}`} style={{ background: theme.bg }}>
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "radial-gradient(circle at 18% 20%, rgba(255,255,255,.8), transparent 34%), radial-gradient(circle at 80% 75%, rgba(255,255,255,.35), transparent 28%)",
        }}
      />

      <svg viewBox="0 0 400 360" className="absolute inset-0 h-full w-full" role="img" aria-label={`${product?.type || "Shopora"} product artwork`}>
        <Art theme={theme} />
      </svg>

      <div className="absolute bottom-5 left-5">
        <p className="text-[9px] font-black tracking-[0.22em]" style={{ color: theme.ink }}>
          {theme.label}
        </p>
        <p className="mt-1 text-xs font-bold" style={{ color: theme.ink }}>
          SHOPORA PERFORMANCE
        </p>
      </div>
    </div>
  );
}
