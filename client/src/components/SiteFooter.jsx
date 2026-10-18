import { Link } from "react-router-dom";
import BrandLogo from "./BrandLogo";
import { OWNER_GITHUB, OWNER_LINKEDIN } from "../config/app";

const groups = [
  {
    title: "SHOP",
    links: [
      ["All products", "/shop"],
      ["Nutrition", "/shop?category=Nutrition"],
      ["Training gear", "/shop?category=Training%20Gear"],
      ["Recovery", "/shop?category=Recovery"],
      ["Wearables", "/shop?category=Wearables"],
    ],
  },
  {
    title: "TRAIN",
    links: [
      ["Fitness plans", "/home#plans"],
      ["Exercises", "/exercises"],
      ["Health tools", "/home#health-tools"],
      ["Tracker", "/tracker"],
    ],
  },
  {
    title: "SHOPORA",
    links: [
      ["Membership", "/home#membership"],
      ["Rewards", "/profile"],
      ["Credits", "/credits"],
      ["Privacy", "/privacy-policy"],
      ["Terms", "/terms"],
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="shopora-footer">
      <div className="shopora-footer-grid">
        <div className="shopora-footer-brand">
          <BrandLogo />
          <p>Train better. Shop smarter.</p>
          <span>Performance commerce, practical health tools and structured training in one focused place.</span>
        </div>

        {groups.map((group) => (
          <nav key={group.title} aria-label={`${group.title} footer links`}>
            <p>{group.title}</p>
            {group.links.map(([label, to]) => <Link key={label} to={to}>{label}</Link>)}
          </nav>
        ))}

        <nav aria-label="Connect footer links">
          <p>CONNECT</p>
          <a href={OWNER_GITHUB} target="_blank" rel="noreferrer">GitHub</a>
          <a href={OWNER_LINKEDIN} target="_blank" rel="noreferrer">LinkedIn</a>
          <a href="https://www.pexels.com" target="_blank" rel="noreferrer">Photos from Pexels</a>
        </nav>
      </div>

      <div className="shopora-footer-bottom">
        <strong>SHOPORA</strong>
        <span>Copyright {new Date().getFullYear()} Shopora</span>
        <span>Fitness commerce and tools</span>
      </div>
    </footer>
  );
}

