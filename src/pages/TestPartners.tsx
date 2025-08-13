import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CompareOptions from "@/components/CompareOptions";
import LeadForm from "@/components/marketing/LeadForm";
import { ArrowLeft } from "lucide-react";

const TestPartners = () => {
  const [selectedShop, setSelectedShop] = useState<{id: string, name: string} | null>(null);

  return (
    <>
      <Helmet>
        <title>Test Partners - DriveX</title>
        <meta name="description" content="Test page for repair partner selection" />
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
              <CardTitle>🧪 Test Page - Repair Partner Selection</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                This is a shortcut page to test the repair partner selection and booking flow 
                without going through the entire AI assessment journey.
              </p>
              <div className="flex gap-4">
                <Button asChild variant="outline">
                  <Link to="/test-booking">Direct to Booking Form</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <CompareOptions 
            decision="repair" 
            postalCode="1234AB" 
            showReplacement={true}
            onRequestReplacement={() => {}}
            onBookSlot={(shopId, shopName) => setSelectedShop({id: shopId, name: shopName})}
          />

          {selectedShop && (
            <section aria-label="Booking form" className="mt-8">
              <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg border border-primary/20 p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                    📅 Book with {selectedShop.name}
                  </h3>
                  <p className="text-muted-foreground">Complete your booking details below</p>
                </div>
                <LeadForm jobType="repair" />
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
};

export default TestPartners;