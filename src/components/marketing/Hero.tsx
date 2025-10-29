import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import CallCenterCTA from "@/components/CallCenterCTA";

const Hero = () => {
  const navigate = useNavigate();
  const [licensePlate, setLicensePlate] = useState("");
  const [phone, setPhone] = useState("");

  function generateToken(length = 24) {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return btoa(String.fromCharCode(...bytes))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }

  const handleStart = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const token = generateToken();
    navigate(`/inspection/${token}`);
  };
  return (
    <section className="relative bg-background overflow-hidden">
      {/* Background banner image */}
      <div className="absolute inset-0">
        <img
          src="/lovable-uploads/55656e15-f7f7-4cf3-9e95-1f90feeb7a19.png"
          alt="Autocristal professional using mobile app for auto glass inspection"
          className="w-full h-full object-cover"
          loading="eager"
          decoding="async"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
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
          
          <form onSubmit={handleStart} className="mt-8 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div className="grid gap-2">
              <Label htmlFor="hero-license" className="text-white">License plate</Label>
              <Input 
                id="hero-license" 
                name="licensePlate" 
                placeholder="ABC-123" 
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
                required 
                className="bg-white/95 border-white/20" 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="hero-phone" className="text-white">Phone number</Label>
              <Input 
                id="hero-phone" 
                name="phone" 
                type="tel" 
                placeholder="(555) 555-5555" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required 
                className="bg-white/95 border-white/20" 
              />
            </div>
            <Button size="lg" type="submit" className="bg-brand hover:bg-brand/90 text-brand-foreground">
              Begin damage assessment
            </Button>
          </form>

          <div className="mt-6">
            <CallCenterCTA />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
