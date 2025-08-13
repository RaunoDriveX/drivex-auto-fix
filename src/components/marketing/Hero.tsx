import heroImage from "@/assets/hero-drivex.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import QRCode from "react-qr-code";
import CallCenterCTA from "@/components/CallCenterCTA";

const Hero = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showOptions, setShowOptions] = useState(false);
  const [vehicle, setVehicle] = useState("");
  const [phone, setPhone] = useState("");
  const [token, setToken] = useState("");

  const isMobile = typeof navigator !== "undefined" && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  function generateToken(length = 24) {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return btoa(String.fromCharCode(...bytes))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }

  const inspectionUrl = useMemo(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return token ? `${origin}/inspection/${token}` : "";
  }, [token]);

  const handleStart = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const v = String(data.get("vehicle") || "");
    const p = String(data.get("phone") || "");
    setVehicle(v);
    setPhone(p);
    setToken(generateToken());
    setShowOptions(true);
  };
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
          
          <form onSubmit={handleStart} className="mt-8 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div className="grid gap-2">
              <Label htmlFor="hero-vehicle" className="text-white">Vehicle</Label>
              <Input id="hero-vehicle" name="vehicle" placeholder="2019 Toyota Camry" required className="bg-white/95 border-white/20" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="hero-phone" className="text-white">Phone</Label>
              <Input id="hero-phone" name="phone" type="tel" placeholder="(555) 555-5555" required className="bg-white/95 border-white/20" />
            </div>
            <Button size="lg" type="submit" className="bg-primary hover:bg-primary/90">Continue</Button>
          </form>

          <div className="mt-4">
            <CallCenterCTA />
          </div>

          {showOptions && (
            <div className="mt-6 grid gap-4 p-6 bg-white/95 backdrop-blur-sm rounded-lg">
              <div className="flex flex-wrap gap-3">
                {isMobile && (
                  <Button size="lg" onClick={() => navigate(`/inspection/${token}`)}>Start instant inspection</Button>
                )}
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => toast({ title: "Link sent via SMS (mock)", description: `To ${phone || "(no number)"}` })}
                >
                  Send SMS link for later
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to={`/report/${token}`}>Review AI report (demo)</Link>
                </Button>
                <CallCenterCTA token={token} />
              </div>

              <div className="grid gap-2">
                <Label>Or scan QR on your phone (mock)</Label>
                <div className="bg-card p-4 rounded-md w-[220px] h-[220px] flex items-center justify-center">
                  <QRCode value={inspectionUrl} size={192} />
                </div>
                <p className="text-sm text-muted-foreground break-all">{inspectionUrl}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Hero;
