import CallCenterCTA from "@/components/CallCenterCTA";

const Hero = () => {
  return (
    <section className="relative bg-background overflow-hidden">
      {/* Background banner image */}
      <div className="absolute inset-0">
        <img
          src="/lovable-uploads/55656e15-f7f7-4cf3-9e95-1f90feeb7a19.png"
          alt="DriveX professional using mobile app for auto glass inspection"
          className="w-full h-full object-cover"
          loading="eager"
          decoding="async"
        />
        <div className="absolute inset-0 bg-black/50"></div>
      </div>
      
      {/* Content overlay */}
      <div className="relative z-10 container mx-auto py-24 lg:py-32">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white">
            Fix your vehicle glass!
          </h1>
          <p className="mt-6 text-lg lg:text-xl text-white/90">
            Report your glass damage in minutes. Our AI triages repair vs. replacement and
            matches you with the best shop based on price, availability, and quality. Uninsured?
            Order a DIY resin kit.
          </p>
          
          <div className="flex flex-wrap gap-4 mt-8">
            <a 
              href="/report/eo3w_x1IBgPaUDj8gsUVkI2qL8rG0gSx" 
              className="px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors text-lg"
            >
              Start Your Assessment
            </a>
            <a 
              href="/inspection/test123" 
              className="px-8 py-4 bg-white/20 text-white font-semibold rounded-lg hover:bg-white/30 transition-colors text-lg backdrop-blur-sm border border-white/20"
            >
              Begin Inspection
            </a>
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
