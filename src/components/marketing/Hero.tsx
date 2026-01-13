import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import CallCenterCTA from "@/components/CallCenterCTA";

const Hero = () => {
  console.log("Hero component rendering...");
  const navigate = useNavigate();
  const { t } = useTranslation('marketing');

  function generateToken(length = 24) {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return btoa(String.fromCharCode(...bytes))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }

  const handleStart = () => {
    const token = generateToken();
    navigate(`/damage-report/${token}`);
  };
  
  return (
    <section className="relative bg-background overflow-hidden">
      {/* Background banner image */}
      <div className="absolute inset-0">
        <img
          src="/lovable-uploads/55656e15-f7f7-4cf3-9e95-1f90feeb7a19.png"
          alt="Glassify professional using mobile app for auto glass inspection"
          className="w-full h-full object-cover"
          loading="eager"
          decoding="async"
          onError={(e) => {
            console.log('Hero image failed to load, hiding...');
            e.currentTarget.style.display = 'none';
          }}
          onLoad={() => {
            console.log('Hero image loaded successfully');
          }}
        />
        <div className="absolute inset-0 bg-black/50"></div>
      </div>
      
      {/* Content overlay */}
      <div className="relative z-10 container mx-auto py-24 lg:py-32">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white">
            {t('hero.title')}
          </h1>
          <p className="mt-6 text-lg lg:text-xl text-white/90">
            {t('hero.description')}
          </p>
          
          <div className="mt-8">
            <Button 
              size="lg" 
              onClick={handleStart} 
              className="bg-brand hover:bg-brand/90 text-brand-foreground text-lg px-8 py-6"
            >
              {t('hero.begin_assessment')}
            </Button>
          </div>

          <div className="mt-6">
            <CallCenterCTA />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
