import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import WhatIsInstruvex from "@/components/landing/WhatIsInstruvex";
import ProblemSolutionSection from "@/components/landing/ProblemSolutionSection";
import ProductsSection from "@/components/landing/ProductsSection";
import WhyInstruvexSection from "@/components/landing/WhyInstruvexSection";
import SocialProofSection from "@/components/landing/SocialProofSection";
import AcademySection from "@/components/landing/AcademySection";
import FeaturedCoursesSection from "@/components/landing/FeaturedCoursesSection";
import StatsSection from "@/components/landing/StatsSection";
import PricingSection from "@/components/landing/PricingSection";
import BookDemoSection from "@/components/landing/BookDemoSection";
import BlogPreviewSection from "@/components/landing/BlogPreviewSection";
import ATSCheckerSection from "@/components/landing/ATSCheckerSection";
import Footer from "@/components/landing/Footer";
import StickyDemoCTA from "@/components/landing/StickyDemoCTA";
import SEO from "@/components/SEO";

const HOMEPAGE_JSONLD = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Instruvex",
    url: "https://instruvex.in",
    logo: "https://instruvex.in/logo.png",
    sameAs: ["https://www.instruvex.in"],
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Instruvex",
    url: "https://instruvex.in",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://instruvex.in/academy?search={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: "Instruvex Academy",
    url: "https://instruvex.in/academy",
    description:
      "Online certification courses in AI, Data Science, Web Development, Programming, and GATE preparation for students in India.",
  },
];

const Index = () => (
  <div className="min-h-screen bg-background">
    <SEO
      title="Instruvex — Online Courses, Certifications & AI ERP Platform in India"
      description="Learn AI, Data Science, Web Development, and GATE preparation with Instruvex Academy. Industry-recognized certifications, internships, and an AI-powered ERP & exam platform for schools and colleges in India."
      path="/"
      jsonLd={HOMEPAGE_JSONLD}
    />
    <Navbar />
    <HeroSection />
    <StatsSection />
    <WhatIsInstruvex />
    <ProblemSolutionSection />
    <ProductsSection />
    <FeaturedCoursesSection />
    <WhyInstruvexSection />
    <SocialProofSection />
    <AcademySection />
    <ATSCheckerSection />
    <PricingSection />
    <BookDemoSection />
    <BlogPreviewSection />
    <Footer />
    <StickyDemoCTA />
  </div>
);

export default Index;
