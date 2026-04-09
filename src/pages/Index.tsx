import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import WhatIsInstruvex from "@/components/landing/WhatIsInstruvex";
import ProblemSolutionSection from "@/components/landing/ProblemSolutionSection";
import ProductsSection from "@/components/landing/ProductsSection";
import WhyInstruvexSection from "@/components/landing/WhyInstruvexSection";
import SocialProofSection from "@/components/landing/SocialProofSection";
import AcademySection from "@/components/landing/AcademySection";
import PricingSection from "@/components/landing/PricingSection";
import BookDemoSection from "@/components/landing/BookDemoSection";
import BlogPreviewSection from "@/components/landing/BlogPreviewSection";
import Footer from "@/components/landing/Footer";
import StickyDemoCTA from "@/components/landing/StickyDemoCTA";

const Index = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <HeroSection />
    <WhatIsInstruvex />
    <ProblemSolutionSection />
    <ProductsSection />
    <WhyInstruvexSection />
    <SocialProofSection />
    <AcademySection />
    <PricingSection />
    <BookDemoSection />
    <BlogPreviewSection />
    <Footer />
    <StickyDemoCTA />
  </div>
);

export default Index;
