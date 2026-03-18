import { Hero } from '../components/Hero';
import { SocialProof } from '../components/SocialProof';
import { HowItWorks } from '../components/HowItWorks';
import { Testimonials } from '../components/Testimonials';
import { Pricing } from '../components/Pricing';
import { Features } from '../components/Features';
import { Footer } from '../components/Footer';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#111111]">
      <Hero />
      <SocialProof />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <Features />
      <Footer />
    </div>
  );
}
