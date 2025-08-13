import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LeadForm from "@/components/marketing/LeadForm";
import { ArrowLeft } from "lucide-react";

const TestBooking = () => {
  return (
    <>
      <Helmet>
        <title>Test Booking - DriveX</title>
        <meta name="description" content="Test page for booking form" />
      </Helmet>

      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Button asChild variant="outline" size="sm">
              <Link to="/" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>🧪 Test Page - Booking Form</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                This is a shortcut page to test the booking form directly.
              </p>
              <div className="flex gap-4">
                <Button asChild variant="outline">
                  <Link to="/test-partners">Test Partner Selection</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg border border-primary/20 p-6">
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                📅 Book with RapidGlass Mobile (Test)
              </h3>
              <p className="text-muted-foreground">Test booking form with repair job type</p>
            </div>
            <LeadForm jobType="repair" />
          </div>

          <div className="mt-8 bg-gradient-to-br from-secondary/5 to-accent/5 rounded-lg border border-secondary/20 p-6">
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                🔧 Book Replacement Service (Test)
              </h3>
              <p className="text-muted-foreground">Test booking form with replacement job type</p>
            </div>
            <LeadForm jobType="replacement" />
          </div>
        </div>
      </main>
    </>
  );
};

export default TestBooking;