import { useNavigate } from "react-router-dom";

export default function MembershipVisualPanel({ currentTier = "starter" }) {
  const navigate = useNavigate();
  return (
    <aside className="membership-visual">
      <img src="/campaign/premium-gym.jpg" alt="" aria-hidden="true" className="membership-visual-image" />
      <div className="membership-visual-overlay" />
      <div className="membership-visual-content">
        <p className="membership-visual-eyebrow">SHOPORA MEMBERSHIP</p>
        <h2>Make every<br />session count.</h2>
        <p>Membership connects your training routine with enhanced Shopora Rewards and a clear 30-day status.</p>
        <div className="membership-visual-stats">
          <div><strong>Starter</strong><span>1x rewards</span></div>
          <div><strong>Pro</strong><span>1.25x rewards</span></div>
          <div><strong>Elite</strong><span>1.5x rewards</span></div>
        </div>
        <div className="membership-current"><span>Current tier</span><strong>{String(currentTier).toUpperCase()}</strong></div>
        <button type="button" onClick={() => navigate("/shop")} className="membership-visual-cta">Explore the store <span aria-hidden="true">-&gt;</span></button>
      </div>
    </aside>
  );
}
