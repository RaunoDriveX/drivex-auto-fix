import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from "react-helmet-async";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { 
  Search, 
  MapPin, 
  Clock, 
  Mail,
  Phone,
  Car,
  Wrench
} from 'lucide-react';

export default function TrackJobLookup() {
  const [jobId, setJobId] = useState('');
  const navigate = useNavigate();

  const handleJobSearch = () => {
    if (!jobId.trim()) {
      toast({
        title: "Job ID Required",
        description: "Please enter your job ID to track your repair.",
        variant: "destructive"
      });
      return;
    }

    navigate(`/track-job/${jobId.trim()}`);
  };

  return (
    <>
      <Helmet>
        <title>Track Your Job - DriveX Job Tracking</title>
        <meta name="description" content="Track your windshield repair job in real-time. Get updates on scheduling, progress, and completion." />
      </Helmet>
      
      <Header />
      
      <main className="min-h-screen bg-background py-12">
        <div className="container mx-auto max-w-2xl px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Track Your Repair Job</h1>
            <p className="text-lg text-muted-foreground">
              Get real-time updates on your windshield repair progress
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Find Your Job
              </CardTitle>
              <CardDescription>
                Enter your job ID to track your repair
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="jobId">Job ID</Label>
                  <Input
                    id="jobId"
                    type="text"
                    placeholder="Enter your job ID (e.g., abc123...)"
                    value={jobId}
                    onChange={(e) => setJobId(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleJobSearch()}
                  />
                  <p className="text-xs text-muted-foreground">
                    Your job ID was provided in your confirmation email
                  </p>
                </div>
                
                <Button 
                  onClick={handleJobSearch} 
                  disabled={!jobId.trim()}
                  className="w-full"
                >
                  Track This Job
                </Button>
              </div>

              <Separator />

              <div className="text-center space-y-2">
                <h4 className="font-medium">Need Help?</h4>
                <p className="text-sm text-muted-foreground">
                  Can't find your job? Contact us for assistance.
                </p>
                <div className="flex items-center justify-center gap-4 text-sm">
                  <a 
                    href="tel:+37258528824" 
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    <Phone className="h-4 w-4" />
                    +372 58528824
                  </a>
                  <a 
                    href="mailto:support@drivex.com" 
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    <Mail className="h-4 w-4" />
                    support@drivex.com
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features Section */}
          <div className="mt-12 grid md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Real-Time Updates</h3>
              <p className="text-sm text-muted-foreground">
                Get instant notifications when your job status changes
              </p>
            </div>
            
            <div>
              <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
                <MapPin className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Shop Details</h3>
              <p className="text-sm text-muted-foreground">
                View shop location, contact info, and directions
              </p>
            </div>
            
            <div>
              <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Car className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Job Timeline</h3>
              <p className="text-sm text-muted-foreground">
                Track progress from scheduling to completion
              </p>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </>
  );
}
