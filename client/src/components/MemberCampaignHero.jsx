import {
  useNavigate,
} from "react-router-dom";

export default function MemberCampaignHero({
  firstName = "there",
  cartCount = 0,
}) {
  const navigate =
    useNavigate();

  return (
    <section className="member-campaign">
      <img
        src="/campaign/hero-dark-gym.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />

      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,6,8,.94)_0%,rgba(5,6,8,.77)_44%,rgba(5,6,8,.18)_100%)]" />

      <div className="campaign-shell relative z-10 flex min-h-[360px] items-end py-10 sm:py-12">
        <div className="max-w-2xl">
          <p className="campaign-eyebrow text-white/55">
            MEMBER WORKSPACE
          </p>

          <h1 className="mt-3 font-heading text-4xl font-extrabold tracking-[-0.045em] text-white sm:text-5xl">
            Welcome back,
            {" "}
            {firstName}.
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-7 text-white/60">
            Your products,
            fitness plans,
            health tools and
            training progress
            are ready when you
            are.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                navigate(
                  "/shop",
                )
              }
              className="campaign-btn campaign-btn-light"
            >
              Shop essentials
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/tracker",
                )
              }
              className="campaign-btn campaign-btn-ghost"
            >
              Open tracker
            </button>
          </div>

          <div className="mt-7 flex items-center gap-5 text-[10px] font-bold uppercase tracking-[0.13em] text-white/40">
            <span>
              Live inventory
            </span>

            <span>
              {cartCount}
              {" "}
              in cart
            </span>

            <span>
              Secure checkout
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
