import { Helmet } from "react-helmet-async";
import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

const analyzeMock = (token: string) => {
  // Deterministic mock triage: simple hash
  let h = 0;
  for (let i = 0; i < token.length; i++) h = (h * 31 + token.charCodeAt(i)) >>> 0;
  const severity = h % 100;
  // 0-49 repair, 50-99 replacement
  return severity < 50 ? ("repair" as const) : ("replacement" as const);
};

const Inspection = () => {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const [step, setStep] = useState<"instructions" | "capturing" | "analyzing" | "result">("instructions");

  const verdict = useMemo(() => (token ? analyzeMock(token) : "repair"), [token]);

  useEffect(() => {
    if (step === "capturing") {
      const t = setTimeout(() => setStep("analyzing"), 1200);
      return () => clearTimeout(t);
    }
    if (step === "analyzing") {
      const t = setTimeout(() => setStep("result"), 1400);
      return () => clearTimeout(t);
    }
  }, [step]);

  const sendBack = () => {
    toast({ title: "Inspection submitted (mock)", description: "Results sent to DriveX." });
  };

  const title = token ? "Smartphone inspection" : "Invalid link";

  return (
    <>
      <Helmet>
        <title>{title} | DriveX</title>
        <meta name="description" content="Mock smartphone windshield inspection flow with guided capture and triage." />
        <link rel="canonical" href={typeof window !== "undefined" ? window.location.href : "/inspection/mock"} />
      </Helmet>

      <main className="bg-background py-10">
        <div className="container mx-auto max-w-2xl">
          {!token ? (
            <Card>
              <CardHeader>
                <CardTitle>Invalid or expired link</CardTitle>
                <CardDescription>Please request a new inspection link.</CardDescription>
              </CardHeader>
              <CardFooter>
                <Button asChild>
                  <Link to="/report">Back to link generator</Link>
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Smartphone inspection</CardTitle>
                <CardDescription>Mock guided capture for token {token.slice(0, 6)}…</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {step === "instructions" && (
                  <div className="space-y-2">
                    <p className="text-muted-foreground">
                      You’ll be guided to capture your windshield at specific angles and lighting. Keep your phone steady.
                    </p>
                    <ul className="list-disc pl-5 text-sm text-muted-foreground">
                      <li>Clean the glass briefly.</li>
                      <li>Move to outdoor light if possible.</li>
                      <li>Avoid reflections.</li>
                    </ul>
                  </div>
                )}
                {step === "capturing" && (
                  <div className="space-y-2">
                    <p className="text-muted-foreground">Capturing views… (mock)</p>
                    <div className="h-2 w-full rounded bg-muted">
                      <div className="h-2 rounded bg-primary" style={{ width: "60%" }} />
                    </div>
                  </div>
                )}
                {step === "analyzing" && (
                  <div className="space-y-2">
                    <p className="text-muted-foreground">Analyzing damage… (mock)</p>
                    <div className="h-2 w-full rounded bg-muted">
                      <div className="h-2 rounded bg-primary" style={{ width: "85%" }} />
                    </div>
                  </div>
                )}
                {step === "result" && (
                  <div className="space-y-3">
                    <div className="p-4 rounded-md border">
                      <p className="text-sm text-muted-foreground">Preliminary triage (mock)</p>
                      <h2 className="text-2xl font-semibold mt-1">
                        {verdict === "repair" ? "Repair recommended" : "Replacement recommended"}
                      </h2>
                      <p className="mt-2 text-muted-foreground">
                        Based on capture quality and detected crack patterns, our mock model suggests
                        {" "}
                        <strong>{verdict}</strong>. A technician will confirm.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                {step === "instructions" && (
                  <Button onClick={() => setStep("capturing")}>Start guided capture</Button>
                )}
                {step === "capturing" && (
                  <Button variant="secondary" onClick={() => setStep("analyzing")}>Next</Button>
                )}
                {step === "analyzing" && (
                  <Button variant="secondary" disabled>Processing…</Button>
                )}
                {step === "result" && (
                  <div className="flex gap-3">
                    <Button onClick={sendBack}>Send result back</Button>
                    <Button asChild variant="secondary">
                      <Link to="/">Return home</Link>
                    </Button>
                  </div>
                )}
              </CardFooter>
            </Card>
          )}
        </div>
      </main>
    </>
  );
};

export default Inspection;
