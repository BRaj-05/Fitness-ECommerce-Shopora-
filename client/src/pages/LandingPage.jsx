import Navbar from "../components/Navbar";
import EditorialCampaignHome from "../components/EditorialCampaignHome";
import SiteFooter from "../components/SiteFooter";

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--lux-bg)] text-[var(--lux-ink)]">
      <Navbar variant="landing" />
      <EditorialCampaignHome />
      <SiteFooter />
    </div>
  );
}
