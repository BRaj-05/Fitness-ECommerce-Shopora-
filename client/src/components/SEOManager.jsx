import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import SEOHead from "./SEOHead";
import { OWNER_GITHUB, OWNER_LINKEDIN } from "../config/app";

const PUBLIC_META = {
  "/": ["Shopora | Fitness Gear, Nutrition & Training", "Shop fitness gear, performance nutrition and recovery essentials with practical plans and health tools."],
  "/shop": ["Shop Fitness Gear & Nutrition | Shopora", "Browse 40 fitness essentials across nutrition, training, recovery, hydration and wearables."],
  "/plans/weight-loss": ["Weight Loss Fitness Plan | Shopora", "Follow a structured weight-loss fitness plan built around sustainable training, recovery and nutrition habits."],
  "/plans/muscle-building": ["Muscle Building Fitness Plan | Shopora", "Build strength with a structured muscle-building plan focused on progression, recovery and consistency."],
  "/plans/mobility-recovery": ["Mobility & Recovery Plan | Shopora", "Improve mobility, movement quality and recovery with a structured Shopora program."],
  "/exercises": ["Exercise Library | Shopora", "Search exercises and build a clearer understanding of movement patterns and muscle groups."],
  "/terms": ["Terms of Use | Shopora", "Read the terms that apply when using Shopora fitness commerce and training tools."],
  "/privacy-policy": ["Privacy Policy | Shopora", "Learn how Shopora handles account, order and fitness-tool information."],
  "/credits": ["Product Photo Credits | Shopora", "View attribution for product photography used throughout the Shopora catalog."],
};

const PRIVATE_PREFIXES = [
  "/auth", "/home", "/profile", "/checkout", "/payment", "/invoice", "/admin", "/tracker", "/notes", "/dev-login",
];

export default function SEOManager() {
  const { pathname } = useLocation();
  const siteUrl = String(import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/$/, "");
  const isPrivate = PRIVATE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isProduct = pathname.startsWith("/product/");
  const metadata = PUBLIC_META[pathname];

  const homeSchemas = useMemo(() => pathname === "/" ? [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Shopora",
      url: siteUrl,
      logo: `${siteUrl}/shopora-mark.svg`,
      sameAs: [OWNER_GITHUB, OWNER_LINKEDIN],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Shopora",
      url: siteUrl,
      potentialAction: {
        "@type": "SearchAction",
        target: `${siteUrl}/shop?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ] : [], [pathname, siteUrl]);

  if (isProduct) {
    return <SEOHead title="Fitness Product | Shopora" description="View product details, live availability and secure checkout information at Shopora." canonicalPath={pathname} />;
  }

  return (
    <SEOHead
      title={metadata?.[0] || (isPrivate ? "Shopora | Secure Workspace" : "Page Not Found | Shopora")}
      description={metadata?.[1] || (isPrivate ? "Secure Shopora customer and operations workspace." : "The requested Shopora page could not be found.")}
      canonicalPath={pathname}
      noindex={isPrivate || !metadata}
      jsonLd={homeSchemas}
    />
  );
}
