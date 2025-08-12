import { Helmet } from "react-helmet-async";
import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import shot1 from "@/assets/ai-report-1.jpg";
import shot2 from "@/assets/ai-report-2.jpg";
import shot3 from "@/assets/ai-report-3.jpg";

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

const images = [
  { src: shot1, alt: "Windshield stone chip – small bullseye near passenger side" },
  { src: shot2, alt: "Windshield long crack extending from edge near driver side" },
  { src: shot3, alt: "Windshield star-break with multiple short radiating cracks" },
];

const AIReport = () => {
  const { token } = useParams<{ token: string }>();
  const result = useMemo(() => analyzeFromToken(token || ""), [token]);

  const canonical = typeof window !== "undefined" ? window.location.href : "/report/mock";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Report",
    name: "DriveX Windshield Damage Assessment",
    headline: "AI windshield damage assessment",
    about: "Windshield repair vs. replacement recommendation",
    datePublished: new Date().toISOString(),
    author: { "@type": "Organization", name: "DriveX AI" },
    image: images.map((i) => i.src),
    articleSection: result.decision === "repair" ? "Repair" : "Replacement",
  };

  return (
    <>
      <Helmet>
        <title>AI Windshield Damage Assessment | DriveX</title>
        <meta name="description" content="See AI-confirmed windshield assessment with images, detected damages, and repair vs. replacement recommendation." />
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
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">AI windshield damage assessment</h1>
              <p className="mt-2 text-muted-foreground">This is a mock report to build confidence in the recommendation.</p>
            </header>

            <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
              <section>
                <Card>
                  <CardHeader>
                    <CardTitle>Captured images</CardTitle>
                    <CardDescription>Representative frames from the guided capture (mock).</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {images.map((img, i) => (
                        <figure key={i} className="overflow-hidden rounded-md border">
                          <img
                            src={img.src}
                            alt={img.alt}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-auto"
                          />
                          <figcaption className="p-2 text-xs text-muted-foreground">{img.alt}</figcaption>
                        </figure>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </section>

              <aside>
                <Card>
                  <CardHeader>
                    <CardTitle>Recommendation</CardTitle>
                    <CardDescription>AI-confirmed preliminary result</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-4 rounded-md border">
                      <p className="text-sm text-muted-foreground">Decision</p>
                      <h2 className="text-2xl font-semibold">
                        {result.decision === "repair" ? "Repair recommended" : "Replacement recommended"}
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">Confidence: {(result.confidence * 100).toFixed(0)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Key factors</p>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        {result.factors.map((f) => (
                          <li key={f}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-wrap gap-3">
                    <Button asChild>
                      <Link to="/#lead-form">Book a shop</Link>
                    </Button>
                    {result.decision === "repair" && (
                      <Button asChild variant="secondary">
                        <Link to="/#lead-form">Order DIY resin</Link>
                      </Button>
                    )}
                    <Button asChild variant="secondary">
                      <Link to="/">Back to home</Link>
                    </Button>
                  </CardFooter>
                </Card>
              </aside>
            </div>
          </article>
        </div>
      </main>
    </>
  );
};

export default AIReport;
