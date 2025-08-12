import heroImage from "@/assets/hero-drivex.jpg";
import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <section className="bg-background">
      <div className="container mx-auto grid gap-8 lg:grid-cols-2 items-center py-16">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            DriveX Auto Glass Repair & Replacement
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Report your glass damage in minutes. Our AI triages repair vs. replacement and
            matches you with the best shop based on price, availability, and quality. Uninsured?
            Order a DIY resin kit.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <a href="#lead-form">
              <Button size="lg">Report Glass Damage</Button>
            </a>
            <a href="#lead-form">
              <Button size="lg" variant="secondary">Order DIY Resin</Button>
            </a>
          </div>
        </div>
        <div className="relative">
          <img
            src={heroImage}
            alt="DriveX platform matching drivers to the best auto glass repair shop"
            className="w-full h-auto rounded-lg shadow"
            loading="eager"
            decoding="async"
          />
        </div>
      </div>
    </section>
  );
};

export default Hero;
