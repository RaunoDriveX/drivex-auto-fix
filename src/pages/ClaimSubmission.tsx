import { useParams, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import ClaimSubmissionForm from "@/components/insurance/ClaimSubmissionForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const ClaimSubmission = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAppointment = async () => {
      if (!appointmentId) {
        setError("No appointment ID provided");
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('id', appointmentId)
          .eq('is_insurance_claim', true)
          .single();

        if (error) {
          throw error;
        }

        if (!data) {
          setError("Appointment not found or not eligible for insurance claim");
          setLoading(false);
          return;
        }

        setAppointment(data);
      } catch (err: any) {
        console.error('Error fetching appointment:', err);
        setError(err.message || "Failed to load appointment details");
      } finally {
        setLoading(false);
      }
    };

    fetchAppointment();
  }, [appointmentId]);

  if (!appointmentId) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <>
        <Helmet>
          <title>Loading Claim Submission | DriveX</title>
        </Helmet>
        <main className="bg-background py-10">
          <div className="container mx-auto max-w-4xl">
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          </div>
        </main>
      </>
    );
  }

  if (error || !appointment) {
    return (
      <>
        <Helmet>
          <title>Claim Submission Error | DriveX</title>
        </Helmet>
        <main className="bg-background py-10">
          <div className="container mx-auto max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                  Unable to Load Claim
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert variant="destructive">
                  <AlertDescription>
                    {error || "This appointment is not eligible for insurance claim submission."}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </main>
      </>
    );
  }

  // Mock damage data - in production, this would come from AI analysis results
  const mockDamageData = {
    damageType: appointment.damage_type || "Stone chip",
    damageSeverity: appointment.ai_recommended_repair === 'replacement' ? "Severe" : "Minor",
    damageLocation: "Driver side, lower left quadrant",
    aiConfidenceScore: appointment.ai_confidence_score || 0.85,
    aiAssessmentDetails: appointment.ai_assessment_details || {},
    recommendedAction: (appointment.ai_recommended_repair || 'chip_repair') as 'repair' | 'replacement',
    estimatedCostMin: appointment.ai_recommended_repair === 'replacement' ? 280 : 75,
    estimatedCostMax: appointment.ai_recommended_repair === 'replacement' ? 450 : 120,
    damagePhotos: appointment.damage_photos || []
  };

  const customerData = {
    name: appointment.customer_name,
    email: appointment.customer_email,
    phone: appointment.customer_phone
  };

  return (
    <>
      <Helmet>
        <title>Submit Insurance Claim | DriveX</title>
        <meta name="description" content="Submit your auto glass insurance claim with complete documentation and AI damage analysis." />
      </Helmet>

      <main className="bg-background py-10">
        <div className="container mx-auto max-w-4xl">
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold flex items-center justify-center gap-2 mb-2">
                <FileText className="h-8 w-8 text-primary" />
                Insurance Claim Submission
              </h1>
              <p className="text-muted-foreground">
                Complete your insurance claim with AI-powered damage assessment and documentation
              </p>
            </div>

            <ClaimSubmissionForm
              appointmentId={appointmentId}
              damageData={mockDamageData}
              customerData={customerData}
            />
          </div>
        </div>
      </main>
    </>
  );
};

export default ClaimSubmission;