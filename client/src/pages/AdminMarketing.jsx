// src/pages/AdminMarketing.jsx
import { useState } from "react";
import AdminNavbar from "../components/AdminNavbar";
import AdminPageHeader from "../components/AdminPageHeader";
import { CheckCircle2, FileText, Search, Send, UsersRound } from "lucide-react";

const StrategyCard = ({ strategy }) => {
  const Icon = strategy.icon;

  return (
  <div
    className="lux-admin-card shopora-lift p-6 sm:p-7"
  >
    {/* Title */}
    <div className="mb-4 flex items-center gap-3">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--lux-soft)] text-[var(--lux-muted)]"><Icon size={18} strokeWidth={1.8} /></span>
      <h3 className="font-heading text-lg font-extrabold text-[var(--lux-ink)] sm:text-xl">{strategy.name}</h3>
    </div>

    {/* Short Explanation */}
    <p className="mb-4 text-sm leading-relaxed text-[var(--lux-muted)]">
      {strategy.explanation}
    </p>

    {/* How it helps e-commerce */}
    <div className="mb-4 border-b border-[var(--lux-line)] pb-4">
      <p className="lux-eyebrow mb-2">
        For Shopora
      </p>
      <p className="text-sm text-[var(--lux-ink)]">{strategy.ecommerceBenefit}</p>
    </div>

    {/* Key Benefits */}
    <div>
      <p className="lux-eyebrow mb-3">
        Key Benefits
      </p>
      <ul className="space-y-2">
        {strategy.benefits.map((benefit, idx) => (
          <li
            key={idx}
            className="flex items-start gap-2.5 text-sm text-[var(--lux-muted)]"
          >
            <CheckCircle2 className="mt-0.5 shrink-0 text-[var(--lux-mint)]" size={18} />
            <span>{benefit}</span>
          </li>
        ))}
      </ul>
    </div>
  </div>
  );
};

const BenefitHighlight = ({ title, description }) => (
  <div className="rounded-xl border border-[var(--lux-line)] bg-[var(--lux-soft)] p-4 sm:p-5">
    <h4
      className="font-heading mb-2 text-base font-extrabold text-[var(--lux-ink)] sm:text-lg"
    >
      {title}
    </h4>
    <p className="text-sm leading-relaxed text-[var(--lux-muted)]">{description}</p>
  </div>
);

export default function AdminMarketing() {
  const [menuOpen, setMenuOpen] = useState(false);

  const strategies = [
    {
      name: "Content Marketing",
      icon: FileText,
      explanation:
        "Create valuable, educational content like fitness guides, nutrition tips, workout routines, and product reviews that engage your audience and establish trust.",
      ecommerceBenefit:
        "Drives organic traffic through SEO, improves brand authority, and helps customers make informed purchasing decisions on your fitness products.",
      benefits: [
        "Increase website traffic through blog posts and guides",
        "Build customer trust and brand credibility",
        "Provide value that encourages repeat visits and purchases",
        "Generate qualified leads who understand your products",
      ],
    },
    {
      name: "SEO Marketing",
      icon: Search,
      explanation:
        "Optimize your website and product pages for search engines by targeting fitness-related keywords like 'best protein supplements,' 'workout equipment,' and 'nutrition plans.'",
      ecommerceBenefit:
        "Improves your visibility in search results, brings highly qualified customers searching for fitness products, and reduces dependency on paid advertising.",
      benefits: [
        "Higher organic search rankings for fitness-related keywords",
        "Lower customer acquisition cost compared to paid ads",
        "Consistent long-term traffic growth",
        "Better product discoverability across search engines",
      ],
    },
    {
      name: "Influencer Marketing",
      icon: UsersRound,
      explanation:
        "Partner with fitness influencers, gym trainers, and nutrition experts to promote Shopora products. They share authentic reviews and recommendations with their engaged audiences.",
      ecommerceBenefit:
        "Leverages trusted voices in the fitness community, reaches targeted fitness enthusiasts, and builds brand credibility through third-party endorsement.",
      benefits: [
        "Access to large, highly engaged fitness audiences",
        "Authentic product reviews from trusted figures",
        "Social media amplification and viral potential",
        "Higher conversion rates from motivated followers",
      ],
    },
    {
      name: "Email & WhatsApp Marketing",
      icon: Send,
      explanation:
        "Build subscriber lists and send personalized product recommendations, exclusive discounts, fitness tips, and order updates directly to customers on email and WhatsApp.",
      ecommerceBenefit:
        "Maintains direct communication channels, drives repeat purchases through personalized offers, and helps customers stay engaged with new Shopora products.",
      benefits: [
        "Direct access to customer inboxes and WhatsApp chats",
        "High open and click-through rates on personalized messages",
        "Drive repeat purchases with exclusive offers and upsells",
        "Improve customer retention and lifetime value",
      ],
    },
  ];

  return (
    <div
      className="admin-lux-page"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <AdminNavbar menuOpen={menuOpen} setMenuOpen={setMenuOpen} />

      <div className="admin-page-content max-w-7xl mx-auto px-4 sm:px-5 lg:px-10 py-8 sm:py-12">
        <AdminPageHeader eyebrow="Strategic overview" title="Marketing strategies" description="Plan content, search, influence and retention work without inventing campaign metrics." action={<span className="rounded-full border border-[var(--lux-line)] bg-[var(--lux-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--lux-muted)]">Campaign tracking not configured</span>} />

        {/* Strategies Grid */}
        <div className="mb-10 sm:mb-12">
          <p className="lux-eyebrow mb-4 sm:mb-6">
            Four Core Approaches
          </p>
          <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2">
            {strategies.map((strategy, idx) => (
              <StrategyCard key={idx} strategy={strategy} />
            ))}
          </div>
        </div>

        {/* Why This Matters Section */}
        <div className="lux-admin-card p-6 sm:p-8">
          <p className="lux-eyebrow mb-3 sm:mb-4">
            Implementation
          </p>
          <h2
            className="font-heading mb-6 text-2xl font-extrabold text-[var(--lux-ink)] sm:mb-8 sm:text-3xl"
          >
            Why This Matters
          </h2>

          <p className="mb-6 text-base leading-relaxed text-[var(--lux-muted)] sm:mb-8">
            These four strategies work together as an integrated marketing ecosystem. Content marketing provides the foundation of trust and value. SEO ensures discovery. Influencer partnerships amplify reach. Email and WhatsApp marketing seal customer relationships and drive repeat purchases.
          </p>

          <p className="mb-8 text-base leading-relaxed text-[var(--lux-muted)] sm:mb-10">
            When executed together, they create a flywheel effect: satisfied customers share their experience, influencers recommend products, search engines rank content higher, and email campaigns keep customers coming back. This multiplier effect is how Shopora achieves sustainable growth in a competitive fitness e-commerce market.
          </p>

          {/* Benefit highlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            <BenefitHighlight
              title="Long-term Growth"
              description="These strategies build compound advantages; each success feeds into the next, creating sustainable momentum rather than short-term spikes."
            />
            <BenefitHighlight
              title="Lower CAC, Higher LTV"
              description="Organic and referral-based strategies reduce customer acquisition cost while maintaining high customer lifetime value through repeat purchases."
            />
            <BenefitHighlight
              title="Brand Authority"
              description="Consistent marketing across channels establishes Shopora as a trusted authority in the fitness and nutrition e-commerce space."
            />
            <BenefitHighlight
              title="Customer Engagement"
              description="Multiple touchpoints keep customers engaged, informed, and excited about new products and content, increasing overall platform stickiness."
            />
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-8 sm:mt-10 text-center">
          <p className="text-xs text-stone-400 tracking-widest">
            These strategies form the backbone of Shopora's growth initiatives
          </p>
        </div>
      </div>
    </div>
  );
}
