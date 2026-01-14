import { Helmet } from "react-helmet-async";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import CallCenterCTA from "@/components/CallCenterCTA";
import CompareOptions from "@/components/CompareOptions";
import LeadForm from "@/components/marketing/LeadForm";
import DIYResinKit from "@/components/DIYResinKit";
import { ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

function analyzeFromToken(token: string) {
  let h = 0;
  for (let i = 0; i < token.length; i++) h = (h * 31 + token.charCodeAt(i)) >>> 0;
  const severity = h % 100;
  const decision = severity < 50 ? "repair" : "replacement";
  const confidence = decision === "repair" ? 0.78 + (severity / 1000) : 0.84 + ((severity - 50) / 1000);
  const factors = decision === "repair"
    ? [
        "Chip diameter below 2.5 cm",
        "Crack length under 6 cm",
        "Not in driver's critical view",
        "No edge impact detected",
      ]
    : [
        "Crack extends from edge",
        "Multiple radiating fractures",
        "Near sensor/camera area",
        "Compromised structural zone",
      ];
  return { decision, confidence: Math.min(0.97, confidence), factors } as const;
}

const AIReport = () => {
  const { token } = useParams<{ token: string }>();
  const result = useMemo(() => ({
    decision: "repair" as const,
    confidence: 0.92,
    factors: [
      "Chip diameter below 2.5 cm",
      "Crack length under 6 cm",
      "Not in driver's critical view",
      "No edge impact detected",
    ],
  }), []);
  const [address, setAddress] = useState("");
  const [partnersVisible, setPartnersVisible] = useState(false);
  const [showReplacement, setShowReplacement] = useState(false);
  const [selectedShop, setSelectedShop] = useState<{id: string, name: string} | null>(null);
  const [existingAppointmentId, setExistingAppointmentId] = useState<string | null>(null);
  const offersRef = useRef<HTMLDivElement | null>(null);
  const bookingRef = useRef<HTMLDivElement | null>(null);

  // Fetch existing appointment by tracking token
  useEffect(() => {
    const fetchAppointment = async () => {
      if (!token) return;
      
      const { data } = await supabase
        .from('appointments')
        .select('id')
        .eq('tracking_token', token)
        .maybeSingle();
      
      if (data?.id) {
        setExistingAppointmentId(data.id);
      }
    };
    
    fetchAppointment();
  }, [token]);
  const reportUrl = "https://admin.drivex.ee/access/b54PrNNRWlX2xutBBJc1AvHW";
  const canonical = typeof window !== "undefined" ? window.location.href : "/report/mock";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Report",
    name: "DriveX Windshield Damage Assessment",
    headline: "AI windshield damage assessment",
    about: "Windshield repair vs. replacement recommendation",
    datePublished: new Date().toISOString(),
    author: { "@type": "Organization", name: "DriveX AI" },
    url: reportUrl,
    isBasedOn: reportUrl,
    articleSection: result.decision === "repair" ? "Repair" : "Replacement",
  };

  // Mock addresses including Staapli 3
  const mockAddresses = [
    "Staapli 3, Tallinn",
    "Staapli 3-1, Tallinn", 
    "Staapli 3A, Tallinn",
    "Narva mnt 15, Tallinn",
    "Viru väljak 4, Tallinn",
    "Pärnu mnt 142, Tallinn",
    "Kadaka tee 76, Tallinn"
  ];

  const filteredAddresses = address ? mockAddresses.filter(addr => 
    addr.toLowerCase().includes(address.toLowerCase())
  ) : [];

  return (
    <>
      <Helmet>
        <title>Windshield Repair Recommendation | DriveX</title>
        <meta name="description" content="AI-confirmed windshield repair assessment with images. Save 85% vs replacement." />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content="AI Windshield Damage Assessment" />
        <meta property="og:description" content="AI-confirmed assessment with images and recommendation." />
        <meta property="og:type" content="article" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <main className="bg-background py-10">
        <div className="container mx-auto max-w-5xl">
          <article>
            <header className="mb-6">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                {result.decision === "repair" ? "Our AI recommends to repair this windshield" : "Our AI recommends windshield replacement"}
              </h1>
              <p className="mt-2 text-muted-foreground">
                {result.decision === "repair" ? "Save 85% of costs compared to a replacement." : "We'll ensure the right glass and calibration for your vehicle."}
              </p>
              <p className="text-muted-foreground">We'll send your inspection result, booking, and pricing via SMS or email.</p>
            </header>

            <div className="space-y-6">
              <section>
                <Card>
                  <CardHeader>
                    <CardTitle>Your car's damage assessment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border overflow-hidden">
                      <img
                        src="/lovable-uploads/c1b17908-3759-47aa-8be9-2ca25b318c3d.png"
                        alt="AI windshield inspection: reference images and detected chip damage — recommended repair"
                        className="w-full h-auto"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-wrap gap-3">
                    <Button asChild variant="secondary">
                      <Link to="/">Back to home</Link>
                    </Button>
                    <CallCenterCTA token={token} decision={result.decision as "repair" | "replacement"} />
                  </CardFooter>
                </Card>

              </section>

            </div>

            <section aria-label="Find partners by address" className="mt-8 animate-fade-in">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle>Find high quality technicians near you</CardTitle>
                    <Badge className="inline-flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Verified by DriveX
                    </Badge>
                  </div>
                  <CardDescription>Enter your address to see relevant repair offers.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setPartnersVisible(true);
                      setTimeout(() => {
                        offersRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }, 0);
                    }}
                    className="flex flex-col sm:flex-row gap-3"
                    aria-label="Address form"
                  >
                    <div className="flex-1 relative">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        placeholder="e.g., Staapli 3, Tallinn"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        autoComplete="street-address"
                      />
                      {address && filteredAddresses.length > 0 && (
                        <div className="absolute top-full left-0 right-0 bg-background border border-input rounded-md mt-1 shadow-lg z-10">
                          {filteredAddresses.slice(0, 5).map((addr, index) => (
                            <button
                              key={index}
                              type="button"
                              className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground first:rounded-t-md last:rounded-b-md"
                              onClick={() => {
                                setAddress(addr);
                              }}
                            >
                              {addr}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button type="submit" className="sm:self-end">Show partners</Button>
                  </form>
                </CardContent>
              </Card>
            </section>

            {partnersVisible && (
              <div ref={offersRef}>
                {/* DIY Kit Section - separate from partner offers */}
                <section aria-label="DIY repair kit" className="mt-6">
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-foreground mb-2">DIY Repair Option</h3>
                    <p className="text-muted-foreground text-sm">Fix small chips yourself with our professional-grade kit</p>
                  </div>
                  <DIYResinKit chipSize={2.0} damageType="chip" />
                </section>

                <section aria-label="Partner offers" className="mt-8">
                  <CompareOptions 
                    decision="repair" 
                    postalCode={address} 
                    showReplacement={showReplacement} 
                    onRequestReplacement={() => setShowReplacement(true)}
                    onBookSlot={(shopId, shopName) => {
                      setSelectedShop({id: shopId, name: shopName});
                      setTimeout(() => bookingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
                    }}
                    chipSize={2.0}
                    damageType="chip"
                  />
                </section>
                
                {selectedShop && (
                  <section ref={bookingRef} aria-label="Booking form" className="mt-8">
                    <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg border border-primary/20 p-6">
                      <div className="mb-4">
                        <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                          📅 Book with {selectedShop.name}
                        </h3>
                        <p className="text-muted-foreground">Complete your booking details below</p>
                      </div>
                      <LeadForm 
                        jobType={result.decision} 
                        shopId={selectedShop.id}
                        shopName={selectedShop.name}
                        existingAppointmentId={existingAppointmentId || undefined}
                      />
                    </div>
                  </section>
                )}
              </div>
            )}
          </article>
        </div>
      </main>
    </>
  );
};

export default AIReport;
