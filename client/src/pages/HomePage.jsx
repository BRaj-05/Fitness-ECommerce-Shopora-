import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../auth/useAuth";
import CartDrawer from "../components/CartDrawer";
import { getAuthHeaders } from "../utils/getAuthHeaders";
import WelcomeBanner from "../components/WelcomeBanner";
import { useWelcomeDiscount } from "../auth/useWelcomeDiscount";
import BMICalculator from "../components/BMICalculator";
import CalorieCalculator from "../components/CalorieCalculator";
import NearbyFitnessCenters from "../components/NearbyFitnessCenters";
import useInfiniteProducts from "../hooks/useInfiniteProducts";
import MembershipSection from "../components/MembershipSection";
import FeaturedProducts from "../components/FeaturedProducts";
import MemberCampaignHero from "../components/MemberCampaignHero";
import SiteFooter from "../components/SiteFooter";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const PLANS = [
  {
    name: "Weight Loss",
    duration: "12 Weeks",
    desc: "Build a sustainable calorie-aware routine with cardio, strength and recovery.",
    tag: "POPULAR",
    route: "/plans/weight-loss",
    accent: "bg-orange-500",
  },
  {
    name: "Muscle Building",
    duration: "16 Weeks",
    desc: "Use progressive overload, recovery and nutrition structure to support strength gains.",
    tag: null,
    route: "/plans/muscle-building",
    accent: "bg-indigo-600",
  },
  {
    name: "Mobility & Recovery",
    duration: "8 Weeks",
    desc: "Improve movement quality, flexibility and recovery with repeatable sessions.",
    tag: null,
    route: "/plans/mobility-recovery",
    accent: "bg-emerald-500",
  },
];

function mapCart(cartDoc, products) {
  return cartDoc.items.map((item) => {
    const product = products.find(
      (p) => Number(p.productId) === Number(item.productId),
    );
    if (!product) {
      return { id: item.productId, qty: item.quantity, name: "Unknown", price: 0 };
    }
    return { ...product, id: product.id || product.productId, qty: item.quantity };
  });
}

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading, logout } = useAuth();
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [products, setProducts] = useState([]);

  const { showBanner, dismissBanner } = useWelcomeDiscount(user);

  useEffect(() => {
    document.title = "Shopora | Fitness Store";
  }, []);

  useEffect(() => {
    if (!location.hash) return;

    const id = location.hash.slice(1);
    const timer = setTimeout(() => {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      document.getElementById(id)?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
    }, 80);

    return () => clearTimeout(timer);
  }, [location.hash]);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 80);
    if (!authLoading && !user) navigate("/auth");
    return () => clearTimeout(timer);
  }, [authLoading, navigate, user]);

  const {
    data: pagesData,
  } = useInfiniteProducts({ limit: 24 });

  const loadedProducts = useMemo(() => {
    if (!pagesData?.pages) return [];
    return pagesData.pages.flatMap((page) =>
      page.data.map((item) => ({ ...item, id: item.productId || item.id })),
    );
  }, [pagesData]);

  useEffect(() => {
    setProducts(loadedProducts);
  }, [loadedProducts]);

  useEffect(() => {
    if (!user || !products.length) return;
    (async () => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API}/api/cart/${user.uid}`, {
          headers,
          credentials: "include",
        });
        if (!response.ok) return;
        const cartDoc = await response.json();
        setCart(mapCart(cartDoc, products));
      } catch (err) {
        console.error("Error loading cart:", err);
      }
    })();
  }, [user, products]);

  const handleSignOut = async () => {
    await logout();
    navigate("/");
  };

  const removeFromCart = async (id) => {
    if (!user) return;
    try {
      const existing = cart.find((item) => item.id === id);
      const headers = await getAuthHeaders();
      const response = await fetch(`${API}/api/cart/${user.uid}/remove`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({ productId: id, quantity: existing?.qty || 1 }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to remove");
      }
      const cartDoc = await response.json();
      setCart(mapCart(cartDoc, products));
    } catch (err) {
      console.error("Remove from cart failed:", err);
      alert(err.message);
    }
  };

  const updateQty = async (id, delta) => {
    if (!user) return;
    try {
      const url = delta > 0 ? "add" : "remove";
      const headers = await getAuthHeaders();
      const response = await fetch(`${API}/api/cart/${user.uid}/${url}`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({ productId: id, quantity: Math.abs(delta) }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update qty");
      }
      const cartDoc = await response.json();
      setCart(mapCart(cartDoc, products));
    } catch (err) {
      console.error("Update qty failed:", err);
      alert(err.message);
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const jsonLd = useMemo(() => {
    if (!products.length) return null;
    const items = products.slice(0, 10).map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${window.location.origin}/product/${product.productId || product.id}`,
      item: {
        "@type": "Product",
        name: product.name,
        image: product.image,
        brand: product.brand,
      },
    }));
    return { "@context": "http://schema.org", "@type": "ItemList", itemListElement: items };
  }, [products]);

  return (
    <div className="min-h-screen bg-[var(--lux-bg)] font-sans text-[var(--lux-ink)]">
      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
      <style>{`
        .fade-in { opacity:0; transform:translateY(16px); transition:opacity .5s ease,transform .5s ease; }
        .fade-in.show { opacity:1; transform:translateY(0); }
        .d1{transition-delay:.05s} .d2{transition-delay:.15s} .d3{transition-delay:.25s}
      `}</style>

      {showBanner && <WelcomeBanner onDismiss={dismissBanner} />}

      <Navbar
        variant="home"
        onCartOpen={() => setCartOpen(true)}
        cartCount={cartCount}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        onSignOut={handleSignOut}
      />

      <MemberCampaignHero
        firstName={
          user?.displayName
            ?.split(" ")[0] ||
          user?.email
            ?.split("@")[0] ||
          "there"
        }
        cartCount={cartCount}
      />

      <div className="shopora-wide-shell home-content-shell space-y-14 py-8 sm:py-10">
        <FeaturedProducts />

        <div className="space-y-14">
          <section id="plans" className="home-plan-showcase scroll-mt-24">
            <div className="home-section-heading">
              <div>
                <p className="lux-eyebrow">DIGITAL COACHING</p>
                <h2 className="mt-2 font-heading text-3xl font-extrabold md:text-4xl">Programs built around outcomes.</h2>
              </div>
              <p>Three focused paths. Clear weekly structure. Progress that stays visible.</p>
            </div>
            <div className="home-plan-grid">
              {PLANS.map((plan, index) => (
                <article key={plan.name} className={`home-plan-card home-plan-card-${index + 1}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="lux-eyebrow">{plan.duration}</p>
                      <h3 className="mt-2 font-heading text-xl font-extrabold md:text-2xl">{plan.name}</h3>
                      <p className="mt-2 text-sm leading-6 text-[var(--lux-muted)]">{plan.desc}</p>
                    </div>
                    <span className="home-plan-index">0{index + 1}</span>
                  </div>
                  <button type="button" onClick={() => navigate(plan.route)} className="home-plan-link">
                    View plan →
                  </button>
                </article>
              ))}
            </div>
          </section>

          <MembershipSection user={user} />
        </div>

        <section id="health-tools" className="home-health-lab scroll-mt-24 space-y-10">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <p className="lux-eyebrow">HEALTH TOOLS</p>
              <h2 className="mt-2 font-heading text-3xl font-extrabold">Know your baseline.</h2>
            </div>
            <div id="tracking" className="health-tracker-cta scroll-mt-24">
              <div>
                <p className="lux-eyebrow">PERSONAL PROGRESS</p>
                <h3 className="mt-2 font-heading text-xl font-extrabold">Training history, kept focused.</h3>
              </div>
              <button type="button" onClick={() => navigate("/tracker")} className="lux-primary-light shrink-0">
                Open tracker
              </button>
            </div>
          </div>
          <div className="health-tool-grid">
            <BMICalculator />
            <CalorieCalculator />
          </div>
        </section>

        <section className="home-rewards-band border-y border-[var(--lux-line)] py-9">
          <p className="lux-eyebrow">LOYALTY PROGRAM</p>
          <div className="mt-3 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <h3 className="font-heading text-2xl font-extrabold md:text-3xl">Earn Shopora Rewards</h3>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--lux-muted)]">Earn points from purchases and fitness activity, then redeem eligible rewards across Shopora.</p>
            </div>
            <button type="button" onClick={() => navigate("/profile")} className="text-sm font-bold text-[var(--lux-orange)]">View rewards →</button>
          </div>
        </section>

        <NearbyFitnessCenters visible={visible} />
      </div>

      <SiteFooter />

      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        cartCount={cartCount}
        cartTotal={cartTotal}
        updateQty={updateQty}
        removeFromCart={removeFromCart}
      />
    </div>
  );
}
