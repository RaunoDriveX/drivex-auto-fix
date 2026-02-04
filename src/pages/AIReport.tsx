import { Helmet } from "react-helmet-async";
import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, CheckCircle } from "lucide-react";
import CallCenterCTA from "@/components/CallCenterCTA";
import { supabase } from "@/integrations/supabase/client";

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
  const [shortCode, setShortCode] = useState<string | null>(null);

  // Fetch existing appointment by tracking token
  useEffect(() => {
    const fetchAppointment = async () => {
      if (!token) return;
      
      const { data } = await supabase
        .from('appointments')
        .select('id, short_code')
        .eq('tracking_token', token)
        .maybeSingle();
      
      if (data?.short_code) {
        setShortCode(data.short_code);
      }
    };
    
    fetchAppointment();
  }, [token]);

  const canonical = typeof window !== "undefined" ? window.location.href : "/report/mock";

  return (
    <>
      <Helmet>
        <title>Windshield Repair Recommendation | Glassify</title>
        <meta name="description" content="AI-confirmed windshield repair assessment with images. Save 85% vs replacement." />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content="AI Windshield Damage Assessment" />
        <meta property="og:description" content="AI-confirmed assessment with images and recommendation." />
        <meta property="og:type" content="article" />
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

              {/* Next Steps Info Card */}
              <section>
                <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle>What happens next?</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-3">
                        <Badge variant="outline" className="mt-0.5 shrink-0">1</Badge>
                        <p className="text-muted-foreground">Your insurer will review your damage report and select nearby repair shops for you.</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <Badge variant="outline" className="mt-0.5 shrink-0">2</Badge>
                        <p className="text-muted-foreground">You'll receive a notification to choose your preferred shop from the options provided.</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <Badge variant="outline" className="mt-0.5 shrink-0">3</Badge>
                        <p className="text-muted-foreground">Once you approve the cost estimate, your repair appointment will be scheduled.</p>
                      </div>
                    </div>
                    
                    {shortCode && (
                      <div className="pt-4 border-t">
                        <p className="text-sm text-muted-foreground mb-3">Track your repair status using your Job ID:</p>
                        <Button asChild variant="outline" className="w-full sm:w-auto">
                          <Link to={`/track/${shortCode}`} className="gap-2">
                            <Search className="h-4 w-4" />
                            Track Job: {shortCode}
                          </Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </section>
            </div>
          </article>
        </div>
      </main>
    </>
  );
};

export default AIReport;
