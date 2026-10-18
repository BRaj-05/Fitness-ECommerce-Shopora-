export default function ShoporaLoader({ label = "Loading", size = 22, className = "" }) {
  return (
    <span className={`shopora-loader ${className}`} role="status" aria-live="polite">
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" opacity="0.18" />
        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="m8.5 12 2.2 2.2 4.8-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.72" />
      </svg>
      {label && <span>{label}</span>}
    </span>
  );
}
