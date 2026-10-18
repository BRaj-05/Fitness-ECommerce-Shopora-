import { ArrowRight, Home } from "lucide-react";
import { Link } from "react-router-dom";
import BrandLogo from "../components/BrandLogo";
import ShoporaAmbientBackground from "../components/ShoporaAmbientBackground";

export default function NotFound() {
  return (
    <main className="shopora-not-found">
      <ShoporaAmbientBackground />
      <div className="shopora-not-found-top"><BrandLogo /></div>
      <div className="shopora-not-found-content">
        <p className="lux-eyebrow text-white/45">ROUTE NOT FOUND</p>
        <h1>404</h1>
        <h2>THAT ROUTE MISSED THE REP.</h2>
        <p>The page moved, the link changed, or this set was never programmed.</p>
        <div>
          <Link to="/" className="shopora-btn bg-white text-black"><Home size={16} /> Go home</Link>
          <Link to="/shop" className="shopora-btn border border-white/20 text-white">Shop gear <ArrowRight size={16} /></Link>
        </div>
      </div>
    </main>
  );
}
