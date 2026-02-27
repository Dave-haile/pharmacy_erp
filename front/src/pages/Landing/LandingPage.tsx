import Header from "./components/Header";
import Footer from "./components/Footer";
import HeroSection from "./components/HeroSection";
import ComplianceGrid from "./components/ComplianceGrid";
import MetricsStrip from "./components/MetricsStrip";
import TestimonialsMarquee from "./components/TestimonialsMarquee";
import CtaSection from "./components/CtaSection";
import ScrollObserver from "./components/ScrollObserver";
import "./components/style.css";
import PageMeta from "@/src/components/common/PageMeta";
import SecuritySection from "./components/SecurityFeatures";
import WorkflowSection from "./components/WorkflowSection";

export const dynamic = "force-dynamic";

export default function LandingPage() {
  return (
    <div className="bg-bg-base dark:bg-bg-base light:bg-gray-50 min-h-screen overflow-x-hidden body-landing">
      <PageMeta
        title="Pharmacy ERP - Modern Pharmacy Management System"
        description="Comprehensive pharmacy management system with AI-powered risk analysis, inventory tracking, and compliance monitoring."
      />
      <div className="gradient-blur">
        <div />
        <div />
        <div />
        <div />
        <div />
        <div />
      </div>

      <Header />
      <ScrollObserver />

      <main>
        <HeroSection />
        <ComplianceGrid />
        <WorkflowSection />
        <MetricsStrip />
        <SecuritySection />
        <TestimonialsMarquee />
        <CtaSection />
      </main>

      <Footer />
    </div>
  );
}
