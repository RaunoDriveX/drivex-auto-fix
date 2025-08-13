import { Helmet } from "react-helmet-async";
import { useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import CallCenterCTA from "@/components/CallCenterCTA";
import CompareOptions from "@/components/CompareOptions";
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
        "Not in driver’s critical view",
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
      "Not in driver’s critical view",
      "No edge impact detected",
    ],
  }), []);
  const [postalCode, setPostalCode] = useState("");
  const [partnersVisible, setPartnersVisible] = useState(false);
  const [showReplacement, setShowReplacement] = useState(false);
  const offersRef = useRef<HTMLDivElement | null>(null);
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
                {result.decision === "repair" ? "Save 85% of costs compared to a replacement." : "We’ll ensure the right glass and calibration for your vehicle."}
              </p>
              <p className="text-muted-foreground">We’ll send your inspection result, booking, and pricing via SMS or email.</p>
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

            <section aria-label="Find partners by postal code" className="mt-8 animate-fade-in">
              <Card>
                <CardHeader>
                  <CardTitle>Find partners near you</CardTitle>
                  <CardDescription>Enter your postal code to see relevant repair offers.</CardDescription>
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
                    aria-label="Postal code form"
                  >
                    <div className="flex-1">
                      <Label htmlFor="postal">Postal code</Label>
                      <Input
                        id="postal"
                        placeholder="e.g., 10115"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        autoComplete="postal-code"
                      />
                    </div>
                    <Button type="submit" className="sm:self-end">Show partners</Button>
                  </form>
                </CardContent>
              </Card>
            </section>

            {partnersVisible && (
              <div ref={offersRef}>
                <section aria-label="Partner offers" className="mt-6">
                  <CompareOptions decision="repair" postalCode={postalCode} showReplacement={showReplacement} onRequestReplacement={() => setShowReplacement(true)} />
                </section>
              </div>
            )}
          </article>
        </div>
      </main>
    </>
  );
};

export default AIReport;
