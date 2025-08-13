import { Helmet } from "react-helmet-async";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, ArrowRight, Camera, Clock, MapPin } from "lucide-react";
import { useState, useEffect } from "react";

const InspectionResults = () => {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<{
    decision: "repair" | "replacement";
    confidence: number;
    damageType: string;
    severity: string;
    location: string;
    estimatedCost: { min: number; max: number };
  } | null>(null);

  // Simulate processing and analysis
  useEffect(() => {
    const processResults = async () => {
      // Simulate AI processing time
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock results based on token (deterministic for demo)
      let hash = 0;
      if (token) {
        for (let i = 0; i < token.length; i++) {
          hash = (hash * 31 + token.charCodeAt(i)) >>> 0;
        }
      }
      
      const isRepair = (hash % 100) < 70; // 70% chance of repair
      const confidence = 0.85 + (hash % 15) / 100; // 85-99% confidence
      
      setResults({
        decision: isRepair ? "repair" : "replacement",
        confidence,
        damageType: isRepair ? "Stone chip" : "Crack extending to edge",
        severity: isRepair ? "Minor" : "Severe",
        location: "Driver side, lower left quadrant",
        estimatedCost: isRepair 
          ? { min: 75, max: 120 }
          : { min: 280, max: 450 }
      });
      
      setLoading(false);
    };

    processResults();
  }, [token]);

  const title = token ? "Inspection Results" : "Invalid link";

  if (!token) {
    return (
      <>
        <Helmet>
          <title>Invalid Link | DriveX</title>
          <meta name="description" content="Invalid inspection link" />
        </Helmet>
        <main className="bg-background py-10">
          <div className="container mx-auto max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle>Invalid or expired link</CardTitle>
                <CardDescription>Please request a new inspection.</CardDescription>
              </CardHeader>
              <CardFooter>
                <Button asChild>
                  <Link to="/">Back to home</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{title} | DriveX</title>
        <meta name="description" content="AI-powered windshield damage assessment results with repair recommendations." />
        <link rel="canonical" href={typeof window !== "undefined" ? window.location.href : "/results/mock"} />
      </Helmet>

      <main className="bg-background py-10">
        <div className="container mx-auto max-w-4xl">
          {loading ? (
            /* Loading State */
            <div className="space-y-6">
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center gap-2">
                    <Camera className="h-6 w-6 text-primary animate-pulse" />
                    Analyzing Your Photos
                  </CardTitle>
                  <CardDescription>
                    Our AI is processing your windshield images...
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <div className="text-center space-y-2">
                      <p className="text-sm text-muted-foreground">Processing damage analysis</p>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: "75%" }}></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : results ? (
            /* Results State */
            <div className="space-y-6">
              {/* Main Result Card */}
              <Card className={`border-2 ${results.decision === "repair" ? "border-success/50 bg-success/5" : "border-destructive/50 bg-destructive/5"}`}>
                <CardHeader className="text-center">
                  <div className="flex items-center justify-center mb-4">
                    {results.decision === "repair" ? (
                      <CheckCircle className="h-12 w-12 text-success" />
                    ) : (
                      <AlertCircle className="h-12 w-12 text-destructive" />
                    )}
                  </div>
                  <CardTitle className="text-2xl">
                    {results.decision === "repair" ? "Repair Recommended" : "Replacement Recommended"}
                  </CardTitle>
                  <CardDescription className="text-lg">
                    AI Confidence: {(results.confidence * 100).toFixed(0)}%
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Damage Details */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold">Damage Analysis</h3>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Type:</span>
                          <span className="font-medium">{results.damageType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Severity:</span>
                          <Badge variant={results.severity === "Minor" ? "secondary" : "destructive"}>
                            {results.severity}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Location:</span>
                          <span className="font-medium">{results.location}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-semibold">Cost Estimate</h3>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Estimated Range:</span>
                          <span className="font-medium">€{results.estimatedCost.min} - €{results.estimatedCost.max}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Service Type:</span>
                          <span className="font-medium">{results.decision === "repair" ? "Mobile/Shop" : "Shop Only"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Duration:</span>
                          <span className="font-medium">{results.decision === "repair" ? "30-60 min" : "2-4 hours"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recommendation Summary */}
                  <div className="p-4 bg-background rounded-lg border">
                    <h3 className="font-semibold mb-2">Our Recommendation</h3>
                    <p className="text-sm text-muted-foreground">
                      {results.decision === "repair" 
                        ? "This damage can be effectively repaired, saving you time and money compared to a full replacement. The repair will restore structural integrity and clarity."
                        : "Due to the extent and location of the damage, we recommend a full windshield replacement to ensure your safety and comply with regulations."
                      }
                    </p>
                  </div>
                </CardContent>
                
                <CardFooter className="flex flex-col sm:flex-row gap-3">
                  <Button asChild className="flex-1">
                    <Link to={`/report/${token}`}>
                      View Detailed Report
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="flex-1">
                    <Link to="/">
                      Return Home
                    </Link>
                  </Button>
                </CardFooter>
              </Card>

              {/* Next Steps Card */}
              <Card>
                <CardHeader>
                  <CardTitle>What's Next?</CardTitle>
                  <CardDescription>
                    Your options for getting this {results.decision} completed
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg text-center">
                      <MapPin className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <h4 className="font-medium mb-1">Find Partners</h4>
                      <p className="text-xs text-muted-foreground">View verified repair shops near you</p>
                    </div>
                    <div className="p-4 border rounded-lg text-center">
                      <Clock className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <h4 className="font-medium mb-1">Book Appointment</h4>
                      <p className="text-xs text-muted-foreground">Schedule convenient time slots</p>
                    </div>
                    <div className="p-4 border rounded-lg text-center">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <h4 className="font-medium mb-1">Get It Fixed</h4>
                      <p className="text-xs text-muted-foreground">Professional service guaranteed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Error State */
            <Card>
              <CardHeader>
                <CardTitle>Processing Error</CardTitle>
                <CardDescription>Unable to analyze your photos at this time.</CardDescription>
              </CardHeader>
              <CardFooter>
                <Button asChild>
                  <Link to={`/inspection/${token}`}>Try Again</Link>
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </main>
    </>
  );
};

export default InspectionResults;