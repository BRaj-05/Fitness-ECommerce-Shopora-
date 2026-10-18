export default function ShoporaAmbientBackground({ className = "" }) {
  return (
    <div className={`shopora-ambient ${className}`} aria-hidden="true">
      <span className="shopora-ambient-grid" />
      <span className="shopora-ambient-glow shopora-ambient-mint" />
      <span className="shopora-ambient-glow shopora-ambient-violet" />
      <span className="shopora-ambient-glow shopora-ambient-orange" />
    </div>
  );
}
