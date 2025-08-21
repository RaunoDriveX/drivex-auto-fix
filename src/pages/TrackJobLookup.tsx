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
import { supabase } from "@/integrations/supabase/client";
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
  const [searchMethod, setSearchMethod] = useState<'email' | 'id'>('email');
  const [email, setEmail] = useState('');
  const [appointmentId, setAppointmentId] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailSearch = async () => {
    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address to find your jobs.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('id, customer_name, service_type, appointment_date, appointment_time, job_status, shop_name')
        .eq('customer_email', email.trim())
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({
          title: "No Jobs Found",
          description: "We couldn't find any repair jobs associated with this email address.",
          variant: "destructive"
        });
        return;
      }

      // If only one job, navigate directly
      if (data.length === 1) {
        navigate(`/track/${data[0].id}`);
        return;
      }

      // Show job selection for multiple jobs
      setJobs(data);
    } catch (error) {
      console.error('Error searching jobs:', error);
      toast({
        title: "Search Error",
        description: "Unable to search for jobs. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleIdSearch = () => {
    if (!appointmentId.trim()) {
      toast({
        title: "Job ID Required",
        description: "Please enter your job ID to track your repair.",
        variant: "destructive"
      });
      return;
    }

    navigate(`/track/${appointmentId.trim()}`);
  };

  const [jobs, setJobs] = useState<any[]>([]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'text-blue-600 bg-blue-50';
      case 'in_progress': return 'text-yellow-600 bg-yellow-50';
      case 'completed': return 'text-green-600 bg-green-50';
      case 'cancelled': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (jobs.length > 0) {
    return (
      <>
        <Helmet>
          <title>Select Your Job - DriveX Job Tracking</title>
          <meta name="description" content="Select which repair job you'd like to track" />
        </Helmet>
        
        <Header />
        
        <main className="min-h-screen bg-background py-12">
          <div className="container mx-auto max-w-4xl px-4">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-4">Select Your Repair Job</h1>
              <p className="text-muted-foreground">
                We found multiple jobs for <span className="font-medium">{email}</span>. Select the one you'd like to track.
              </p>
            </div>

            <div className="grid gap-4">
              {jobs.map((job) => (
                <Card 
                  key={job.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/track/${job.id}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <h3 className="font-semibold text-lg">{job.service_type} Service</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.job_status)}`}>
                            {job.job_status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{job.shop_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{job.appointment_date} at {job.appointment_time}</span>
                          </div>
                        </div>
                      </div>
                      
                      <Button variant="outline">
                        Track This Job
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-8">
              <Button 
                variant="ghost" 
                onClick={() => {
                  setJobs([]);
                  setEmail('');
                }}
              >
                Search Again
              </Button>
            </div>
          </div>
        </main>
        
        <Footer />
      </>
    );
  }

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
                Enter your email address or job ID to track your repair
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Search Method Tabs */}
              <div className="flex gap-1 p-1 bg-muted rounded-lg">
                <button
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    searchMethod === 'email' 
                      ? 'bg-background text-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setSearchMethod('email')}
                >
                  <Mail className="h-4 w-4 inline mr-2" />
                  Search by Email
                </button>
                <button
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    searchMethod === 'id' 
                      ? 'bg-background text-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setSearchMethod('id')}
                >
                  <Wrench className="h-4 w-4 inline mr-2" />
                  Search by Job ID
                </button>
              </div>

              {searchMethod === 'email' ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleEmailSearch()}
                    />
                    <p className="text-xs text-muted-foreground">
                      We'll show all repair jobs associated with this email
                    </p>
                  </div>
                  
                  <Button 
                    onClick={handleEmailSearch} 
                    disabled={loading || !email.trim()}
                    className="w-full"
                  >
                    {loading ? 'Searching...' : 'Find My Jobs'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="jobId">Job ID</Label>
                    <Input
                      id="jobId"
                      type="text"
                      placeholder="Enter your job ID (e.g., abc123...)"
                      value={appointmentId}
                      onChange={(e) => setAppointmentId(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleIdSearch()}
                    />
                    <p className="text-xs text-muted-foreground">
                      Your job ID was provided in your confirmation email
                    </p>
                  </div>
                  
                  <Button 
                    onClick={handleIdSearch} 
                    disabled={!appointmentId.trim()}
                    className="w-full"
                  >
                    Track This Job
                  </Button>
                </div>
              )}

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