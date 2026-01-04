import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import ChatMockup from "@/components/landing/ChatMockup";
import FloatingCards from "@/components/landing/FloatingCards";
import SocialProof from "@/components/landing/SocialProof";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main>
        <Hero />
        
        {/* Phone Mockup Section */}
        <section className="relative py-8 md:py-16 overflow-hidden">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="relative mx-auto max-w-3xl flex flex-col items-center justify-center">
              <div className="relative w-[280px] sm:w-[320px] mx-auto">
                <ChatMockup />
                <FloatingCards />
              </div>
            </div>
          </div>
        </section>
        
        <SocialProof />
      </main>
    </div>
  );
};

export default Index;
