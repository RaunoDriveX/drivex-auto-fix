import heroImage from "@/assets/hero-drivex.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const navigate = useNavigate();
  const handleStart = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const vehicle = String(data.get("vehicle") || "");
    const phone = String(data.get("phone") || "");
    navigate(`/report?vehicle=${encodeURIComponent(vehicle)}&phone=${encodeURIComponent(phone)}`);
  };
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
<form onSubmit={handleStart} className="mt-6 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div className="grid gap-1">
              <Label htmlFor="hero-vehicle">Vehicle</Label>
              <Input id="hero-vehicle" name="vehicle" placeholder="2019 Toyota Camry" required />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="hero-phone">Phone</Label>
              <Input id="hero-phone" name="phone" type="tel" placeholder="(555) 555-5555" required />
            </div>
            <Button size="lg" type="submit">Continue</Button>
          </form>
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
