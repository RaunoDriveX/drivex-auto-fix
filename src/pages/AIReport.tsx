import { Helmet } from "react-helmet-async";
import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

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
  const result = useMemo(() => analyzeFromToken(token || ""), [token]);
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
              <p className="mt-2 text-muted-foreground">Review your AI report below, then continue with the next steps.</p>
            </header>

            <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
              <section>
                <Card>
                  <CardHeader>
                    <CardTitle>AI report (web view)</CardTitle>
                    <CardDescription>Secure embedded report with the repair/replace decision.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border overflow-hidden">
                      <iframe
                        src={reportUrl}
                        title="DriveX AI report"
                        className="w-full h-[70vh]"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button asChild>
                      <a href={reportUrl} target="_blank" rel="noopener noreferrer">Open full report in new tab</a>
                    </Button>
                  </CardFooter>
                </Card>
              </section>

              <aside>
                <Card>
                  <CardHeader>
                    <CardTitle>Next steps</CardTitle>
                    <CardDescription>You're almost done — select a repair shop to proceed.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Your progress</p>
                      <Progress value={66} />
                      <p className="mt-1 text-xs text-muted-foreground">Step 2 of 3</p>
                    </div>
                    <ol className="list-decimal pl-5 space-y-1 text-sm">
                      <li className="">Inspection completed</li>
                      <li className="">AI report reviewed ({result.decision === "repair" ? "Repair" : "Replacement"})</li>
                      <li className="text-muted-foreground">Select repair shop</li>
                      <li className="text-muted-foreground">Book appointment</li>
                    </ol>
                  </CardContent>
                  <CardFooter className="flex flex-wrap gap-3">
                    <Button asChild>
                      <Link to="/#lead-form">Select repair shop</Link>
                    </Button>
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
