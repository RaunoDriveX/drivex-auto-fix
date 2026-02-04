import { Helmet } from "react-helmet-async";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, ArrowRight, Camera, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const InspectionResults = () => {
  const { token } = useParams<{ token: string }>();
  const { t } = useTranslation('common');
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
        damageType: isRepair ? "stone_chip" : "crack_extending",
        severity: isRepair ? "minor" : "severe",
        location: "location_default",
        estimatedCost: isRepair 
          ? { min: 75, max: 120 }
          : { min: 280, max: 450 }
      });
      
      setLoading(false);
    };

    processResults();
  }, [token]);

  const title = token ? t('inspection_results.page_title') : t('inspection_results.invalid_link_title');

  if (!token) {
    return (
      <>
        <Helmet>
          <title>{t('inspection_results.invalid_link_title')} | DriveX</title>
          <meta name="description" content={t('inspection_results.invalid_link_desc')} />
        </Helmet>
        <main className="bg-background py-10">
          <div className="container mx-auto max-w-2xl">
            <div className="flex justify-end mb-4">
              <LanguageSwitcher />
            </div>
            <Card>
              <CardHeader>
                <CardTitle>{t('inspection_results.invalid_link_desc')}</CardTitle>
                <CardDescription>{t('inspection_results.invalid_link_subtitle')}</CardDescription>
              </CardHeader>
              <CardFooter>
                <Button asChild>
                  <Link to="/">{t('buttons.back_to_home')}</Link>
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
        <meta name="description" content={t('inspection_results.analyzing_desc')} />
        <link rel="canonical" href={typeof window !== "undefined" ? window.location.href : "/results/mock"} />
      </Helmet>

      <main className="bg-background py-10">
        <div className="container mx-auto max-w-4xl">
          <div className="flex justify-end mb-4">
            <LanguageSwitcher />
          </div>
          
          {loading ? (
            /* Loading State */
            <div className="space-y-6">
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center gap-2">
                    <Camera className="h-6 w-6 text-primary animate-pulse" />
                    {t('inspection_results.analyzing_title')}
                  </CardTitle>
                  <CardDescription>
                    {t('inspection_results.analyzing_desc')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <div className="text-center space-y-2">
                      <p className="text-sm text-muted-foreground">{t('inspection_results.processing')}</p>
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
                    {results.decision === "repair" 
                      ? t('inspection_results.repair_recommended') 
                      : t('inspection_results.replacement_recommended')}
                  </CardTitle>
                  <CardDescription className="text-lg">
                    {t('inspection_results.ai_confidence')}: {(results.confidence * 100).toFixed(0)}%
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Damage Details */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold">{t('inspection_results.damage_analysis')}</h3>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('inspection_results.type')}:</span>
                          <span className="font-medium">{t(`inspection_results.${results.damageType}`)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('inspection_results.severity')}:</span>
                          <Badge variant={results.severity === "minor" ? "secondary" : "destructive"}>
                            {t(`inspection_results.${results.severity}`)}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('inspection_results.location')}:</span>
                          <span className="font-medium">{t(`inspection_results.${results.location}`)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-semibold">{t('inspection_results.cost_estimate')}</h3>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('inspection_results.estimated_range')}:</span>
                          <span className="font-medium">€{results.estimatedCost.min} - €{results.estimatedCost.max}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('inspection_results.service_type')}:</span>
                          <span className="font-medium">
                            {results.decision === "repair" 
                              ? t('inspection_results.mobile_shop') 
                              : t('inspection_results.shop_only')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('inspection_results.duration')}:</span>
                          <span className="font-medium">{results.decision === "repair" ? "30-60 min" : "2-4 h"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recommendation Summary */}
                  <div className="p-4 bg-background rounded-lg border">
                    <h3 className="font-semibold mb-2">{t('inspection_results.our_recommendation')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {results.decision === "repair" 
                        ? t('inspection_results.repair_recommendation_text')
                        : t('inspection_results.replacement_recommendation_text')
                      }
                    </p>
                  </div>
                </CardContent>
                
                <CardFooter className="flex flex-col sm:flex-row gap-3">
                  <Button asChild className="flex-1">
                    <Link to={`/report/${token}`}>
                      {t('inspection_results.view_detailed_report')}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="flex-1">
                    <Link to="/">
                      {t('inspection_results.return_home')}
                    </Link>
                  </Button>
                </CardFooter>
              </Card>

              {/* Next Steps Card */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('inspection_results.whats_next')}</CardTitle>
                  <CardDescription>
                    {t('inspection_results.whats_next_desc', { 
                      action: results.decision === "repair" 
                        ? t('inspection_results.repair_recommended').toLowerCase() 
                        : t('inspection_results.replacement_recommended').toLowerCase() 
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg text-center">
                      <Clock className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <h4 className="font-medium mb-1">{t('inspection_results.book_appointment')}</h4>
                      <p className="text-xs text-muted-foreground">{t('inspection_results.book_appointment_desc')}</p>
                    </div>
                    <div className="p-4 border rounded-lg text-center">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <h4 className="font-medium mb-1">{t('inspection_results.get_it_fixed')}</h4>
                      <p className="text-xs text-muted-foreground">{t('inspection_results.get_it_fixed_desc')}</p>
                    </div>
                  </div>
                  <p className="text-sm text-center text-muted-foreground pt-2 border-t">
                    Your insurer will select repair shops for you. You can track your job status and choose your preferred shop from your tracking page.
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Error State */
            <Card>
              <CardHeader>
                <CardTitle>{t('inspection_results.processing_error')}</CardTitle>
                <CardDescription>{t('inspection_results.processing_error_desc')}</CardDescription>
              </CardHeader>
              <CardFooter>
                <Button asChild>
                  <Link to={`/inspection/${token}`}>{t('inspection_results.try_again')}</Link>
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