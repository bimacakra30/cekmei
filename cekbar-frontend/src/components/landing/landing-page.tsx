import { useEffect } from "react";
import { ANIMATION_STYLES } from "./landing-hooks";
import { Navbar } from "./landing-navbar";
import { Hero } from "./landing-hero";
import { Features } from "./landing-features";
import { HowItWorks } from "./landing-how-it-works";
import { Stats } from "./landing-stats";
import { Kontak } from "./landing-kontak";
import { CTA } from "./landing-cta";
import { Footer } from "./landing-footer";

export function LandingPage() {
  useEffect(() => {
    if (document.getElementById("lp-styles")) return;
    const style = document.createElement("style");
    style.id = "lp-styles";
    style.textContent = ANIMATION_STYLES;
    document.head.appendChild(style);
    return () => { document.getElementById("lp-styles")?.remove(); };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Stats />
      <Kontak />
      <CTA />
      <Footer />
    </div>
  );
}
