import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import WhatIsInstruvex from "@/components/landing/WhatIsInstruvex";
import FeaturesSection from "@/components/landing/FeaturesSection";
import AcademySection from "@/components/landing/AcademySection";
import PricingSection from "@/components/landing/PricingSection";
import Footer from "@/components/landing/Footer";

const Index = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <HeroSection />
    <WhatIsInstruvex />
    <FeaturesSection />
    <AcademySection />
    <PricingSection />
    <Footer />
  </div>
);

export default Index;
