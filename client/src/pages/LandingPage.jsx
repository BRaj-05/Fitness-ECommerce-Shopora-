import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import CreatorCredit from "../components/CreatorCredit";
import EditorialCampaignHome from "../components/EditorialCampaignHome";
import { REPOSITORY_URL } from "../config/app";

export default function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Shopora | Train better. Shop smarter.";
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--lux-bg)] text-[var(--lux-ink)]">
      <Navbar variant="landing" />
      <EditorialCampaignHome />

      <footer className="border-t border-[var(--lux-line)] bg-[var(--lux-surface)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-10">
          <div>
            <p className="font-heading text-lg font-extrabold">Shopora</p>
            <p className="mt-1 text-xs text-slate-500">Fitness commerce & practical health tools.</p>
          </div>
          <div className="flex flex-wrap gap-5 text-xs font-medium text-slate-500">
            <button onClick={() => navigate("/privacy-policy")} className="hover:text-indigo-600">Privacy</button>
            <button onClick={() => navigate("/terms")} className="hover:text-indigo-600">Terms</button>
            <a href={REPOSITORY_URL} target="_blank" rel="noreferrer" className="hover:text-indigo-600">GitHub</a>
          </div>
          <CreatorCredit />
          <p className="text-xs text-slate-400">© 2026 Shopora. Fitness commerce & tools.</p>
        </div>
      </footer>
    </div>
  );
}
