import { useEffect } from "react";
import AboutSection from "./components/AboutSection";
import CoulombSimulator from "./components/CoulombSimulator";
import ElectricFieldVisualizer from "./components/ElectricFieldVisualizer";
import Footer from "./components/Footer";
import HeroSection from "./components/HeroSection";
import LightningFormationDemo from "./components/LightningFormationDemo";
import Navbar from "./components/Navbar";
import StaticElectricityDemo from "./components/StaticElectricityDemo";

export default function App() {
  useEffect(() => {
    document.title = "ElectroLearn — The Science of Lightning & Electrostatics";
    const desc = document.createElement("meta");
    desc.name = "description";
    desc.content =
      "An interactive educational website exploring the physics of lightning and electrostatics — Coulomb's Law, electric fields, lightning formation, and static electricity.";
    document.head.appendChild(desc);
    return () => {
      document.head.removeChild(desc);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground font-body overflow-x-hidden">
      <Navbar />
      <main>
        <HeroSection />
        <CoulombSimulator />
        <ElectricFieldVisualizer />
        <LightningFormationDemo />
        <StaticElectricityDemo />
        <AboutSection />
      </main>
      <Footer />
    </div>
  );
}
