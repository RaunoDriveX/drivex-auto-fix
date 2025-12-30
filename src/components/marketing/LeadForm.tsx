import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { format, addDays, isToday, isTomorrow } from "date-fns";
import { CalendarIcon, Clock, CheckCircle2, Home, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import CallCenterCTA from "@/components/CallCenterCTA";

type LeadFormProps = {
  jobType?: "repair" | "replacement";
  shopId?: string;
  shopName?: string;
};

const LeadForm = ({ jobType = "repair", shopId = "default-shop", shopName = "DriveX Service Center" }: LeadFormProps) => {
  const [loading, setLoading] = useState(false);
  const [isInsuranceClaim, setIsInsuranceClaim] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [copied, setCopied] = useState(false);
  const [insurers, setInsurers] = useState<{ id: string; insurer_name: string }[]>([]);
  const [bookingDetails, setBookingDetails] = useState<{
    shopName: string;
    date: string;
    time: string;
    email: string;
    trackingCode: string;
  } | null>(null);

  // Fetch insurers from database
  useEffect(() => {
    const fetchInsurers = async () => {
      const { data, error } = await supabase
        .from('insurer_profiles')
        .select('id, insurer_name')
        .order('insurer_name');
      
      if (error) {
        console.error('Error fetching insurers:', error);
        return;
      }
      
      setInsurers(data || []);
    };
    
    fetchInsurers();
  }, []);

  const copyTrackingCode = async () => {
    if (bookingDetails?.trackingCode) {
      await navigator.clipboard.writeText(bookingDetails.trackingCode);
      setCopied(true);
      toast.success("Tracking code copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const jobDuration = jobType === "repair" ? "30 minutes" : "2.5 hours";
  const jobDurationMinutes = jobType === "repair" ? 30 : 150;

  // Fetch booked time slots when date is selected
  useEffect(() => {
    const fetchBookedSlots = async () => {
      if (!selectedDate) {
        setBookedSlots([]);
        return;
      }

      try {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        
        // Fetch all confirmed appointments for this shop and date
        const { data: confirmedAppointments, error: confirmedError } = await supabase
          .from('appointments')
          .select('appointment_time')
          .eq('shop_id', shopId)
          .eq('appointment_date', dateStr)
          .eq('status', 'confirmed');

        if (confirmedError) {
          console.error('Error fetching confirmed appointments:', confirmedError);
        }

        // Fetch all appointments with accepted job offers for this shop and date
        const { data: acceptedJobs, error: acceptedError } = await supabase
          .from('appointments')
          .select(`
            appointment_time,
            job_offers!inner(status)
          `)
          .eq('shop_id', shopId)
          .eq('appointment_date', dateStr)
          .eq('job_offers.status', 'accepted');

        if (acceptedError) {
          console.error('Error fetching accepted jobs:', acceptedError);
        }

        // Combine both lists and extract unique booked times
        const allBooked = [
          ...(confirmedAppointments?.map(apt => apt.appointment_time?.substring(0, 5)) || []),
          ...(acceptedJobs?.map(apt => apt.appointment_time?.substring(0, 5)) || [])
        ];
        
        // Remove duplicates
        const uniqueBooked = [...new Set(allBooked)].filter(Boolean);
        setBookedSlots(uniqueBooked);
        
        console.log('Booked slots for', dateStr, ':', uniqueBooked);
      } catch (error) {
        console.error('Error in fetchBookedSlots:', error);
      }
    };

    fetchBookedSlots();
  }, [selectedDate, shopId]);

  const generateTimeSlots = (date: Date) => {
    const slots = [];
    const startHour = 8; // 8 AM
    const endHour = 17; // 5 PM
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += jobDurationMinutes) {
        if (hour * 60 + minute + jobDurationMinutes <= endHour * 60) {
          const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          const endTime = `${Math.floor((hour * 60 + minute + jobDurationMinutes) / 60).toString().padStart(2, '0')}:${((hour * 60 + minute + jobDurationMinutes) % 60).toString().padStart(2, '0')}`;
          
          // Only add slot if it's not already booked
          if (!bookedSlots.includes(time)) {
            slots.push(`${time} - ${endTime}`);
          }
        }
      }
    }
    return slots;
  };

  const availableSlots = selectedDate ? generateTimeSlots(selectedDate) : [];

  const formatDateLabel = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEEE, MMM d");
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    // Save form reference before async operations
    const form = e.currentTarget;
    
    try {
      const formData = new FormData(form);
      const customerName = formData.get('name') as string;
      const customerEmail = formData.get('email') as string;
      const customerPhone = formData.get('phone') as string;
      const isInsurance = formData.get('insuranceClaim') === 'yes';
      const insurerName = formData.get('insurerName') as string;
      
      if (!selectedDate || !selectedTimeSlot) {
        toast.error("Please select a date and time slot");
        return;
      }

      // Extract time from slot (format: "09:00 - 09:30")
      const timeSlot = selectedTimeSlot.split(' - ')[0];
      const totalCost = jobType === "repair" ? 89 : 350;
      const newAppointmentId = crypto.randomUUID();
      
      // Create appointment (no select after insert to avoid RLS on SELECT)
      const { error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          id: newAppointmentId,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          shop_id: shopId,
          shop_name: shopName,
          service_type: jobType,
          appointment_date: format(selectedDate, 'yyyy-MM-dd'),
          appointment_time: timeSlot,
          is_insurance_claim: isInsurance,
          insurer_name: isInsurance ? insurerName : null,
          status: 'pending',
          total_cost: totalCost
        });

      if (appointmentError) {
        console.error('Error creating appointment:', appointmentError);
        toast.error("Failed to create appointment. Please try again.");
        return;
      }

      // Fetch the generated short_code from the database
      const { data: appointmentData } = await supabase
        .from('appointments')
        .select('short_code')
        .eq('id', newAppointmentId)
        .single();

      const trackingCode = appointmentData?.short_code || newAppointmentId.slice(0, 8).toUpperCase();

      // Show success immediately
      toast.success("Booking confirmed! Check your email for confirmation details.");
      
      // Set booking complete state immediately
      setBookingComplete(true);
      setBookingDetails({
        shopName,
        date: format(selectedDate, 'EEEE, MMMM d, yyyy'),
        time: timeSlot,
        email: customerEmail,
        trackingCode
      });

      // Run background tasks in parallel without blocking UI
      const backgroundTasks = [
        // Send confirmation email
        supabase.functions.invoke('send-confirmation-email', {
          body: {
            appointmentId: newAppointmentId,
            jobCode: trackingCode,
            customerName,
            customerEmail,
            shopName,
            appointmentDate: format(selectedDate, 'yyyy-MM-dd'),
            appointmentTime: timeSlot,
            serviceType: jobType,
            totalCost: totalCost
          }
        }).then(({ error: emailError }) => {
          if (emailError) {
            console.error('Error sending confirmation email:', emailError);
          } else {
            // Update appointment to mark confirmation email as sent
            supabase
              .from('appointments')
              .update({ confirmation_email_sent: true })
              .eq('id', newAppointmentId);
          }
        })
      ];
      
      // Only trigger job allocation for insurance claims
      // Direct bookings don't need to be routed to multiple shops
      if (isInsurance) {
        backgroundTasks.push(
          supabase.functions.invoke('allocate-job', {
            body: {
              appointmentId: newAppointmentId,
              serviceType: jobType,
              damageType: 'chip',
              vehicleInfo: {
                make: 'Toyota',
                model: 'Camry',
                year: 2020
              },
              customerLocation: {
                latitude: 52.3676,
                longitude: 4.9041
              },
              insurerName
            }
          }).then(({ error: allocationError }) => {
            if (allocationError) {
              console.error('Error in job allocation:', allocationError);
            } else {
              console.log('Job successfully allocated to eligible shops');
            }
          })
        );
      }
      
      Promise.all(backgroundTasks).catch(error => {
        console.error('Error in background tasks:', error);
      });
      
    } catch (error) {
      console.error('Error during booking:', error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Show success state if booking is complete
  if (bookingComplete && bookingDetails) {
    return (
      <section id="lead-form" aria-labelledby="lead-form-heading" className="bg-background">
        <div className="container mx-auto max-w-3xl">
          <Card className="shadow-lg border-success/40 bg-success/5">
            <CardContent className="p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-success/10 p-4">
                  <CheckCircle2 className="h-16 w-16 text-success" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Booking Confirmed!
              </h2>
              <p className="text-muted-foreground mb-6">
                Your appointment has been successfully scheduled
              </p>
              
              <div className="bg-background rounded-lg p-6 mb-6 text-left space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-muted-foreground font-medium min-w-[100px]">Shop:</span>
                  <span className="text-foreground font-semibold">{bookingDetails.shopName}</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-muted-foreground font-medium min-w-[100px]">Date:</span>
                  <span className="text-foreground">{bookingDetails.date}</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-muted-foreground font-medium min-w-[100px]">Time:</span>
                  <span className="text-foreground">{bookingDetails.time}</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-muted-foreground font-medium min-w-[100px]">Email:</span>
                  <span className="text-foreground">{bookingDetails.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground font-medium min-w-[100px]">Tracking Code:</span>
                  <span className="text-foreground font-mono font-bold text-lg">{bookingDetails.trackingCode}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyTrackingCode}
                    className="h-8 px-2"
                  >
                    {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Use this code at <Link to="/track" className="text-primary hover:underline">Track Your Job</Link> to check your repair status.
                </p>
              </div>

              <p className="text-sm text-muted-foreground mb-6">
                A confirmation email with all the details has been sent to your email address.
              </p>

              <Button asChild size="lg" className="gap-2">
                <Link to="/" onClick={() => window.scrollTo(0, 0)}>
                  <Home className="h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section id="lead-form" aria-labelledby="lead-form-heading" className="bg-background">
      <div className="container mx-auto max-w-3xl">
        <Card className="shadow-lg border-primary/20">
          <CardContent className="p-6">
            <form onSubmit={onSubmit} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" name="name" placeholder="Jane Doe" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="jane@example.com" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone number</Label>
                <Input id="phone" name="phone" type="tel" placeholder="+31 6 12345678" required />
              </div>
              <div className="grid gap-2">
                <Label>Is this an insurance claim?</Label>
                <Select name="insuranceClaim" onValueChange={setIsInsuranceClaim}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes, insurance claim</SelectItem>
                    <SelectItem value="no">No, paying myself</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {isInsuranceClaim === "yes" && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="insurerName">Insurance company</Label>
                    <Select name="insurerName">
                      <SelectTrigger>
                        <SelectValue placeholder="Select your insurance company" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border border-border z-50">
                        {/* Database insurers (partners) */}
                        {insurers.map((insurer) => (
                          <SelectItem key={insurer.id} value={insurer.insurer_name}>
                            {insurer.insurer_name}
                          </SelectItem>
                        ))}
                        {/* Hardcoded common insurers */}
                        <SelectItem value="allianz">Allianz</SelectItem>
                        <SelectItem value="axa">AXA</SelectItem>
                        <SelectItem value="ing">ING</SelectItem>
                        <SelectItem value="aegon">Aegon</SelectItem>
                        <SelectItem value="nn">Nationale Nederlanden</SelectItem>
                        <SelectItem value="achmea">Achmea</SelectItem>
                        <SelectItem value="univé">Univé</SelectItem>
                        <SelectItem value="centraal-beheer">Centraal Beheer</SelectItem>
                        <SelectItem value="ohra">Ohra</SelectItem>
                        <SelectItem value="fbto">FBTO</SelectItem>
                        <SelectItem value="asr">ASR</SelectItem>
                        <SelectItem value="delta-lloyd">Delta Lloyd</SelectItem>
                        <SelectItem value="other">Other / Not listed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
               
               <div className="grid gap-4">
                <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-accent" />
                    <span className="font-medium text-sm">Service Duration: {jobDuration}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {jobType === "repair" ? "Quick chip repair at your location" : "Complete windshield replacement"}
                  </p>
                </div>
                
                <div className="grid gap-2">
                  <Label>Select appointment date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? formatDateLabel(selectedDate) : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) => date < new Date() || date > addDays(new Date(), 30)}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                {selectedDate && (
                  <div className="grid gap-2">
                    <Label>Available time slots</Label>
                    <Select value={selectedTimeSlot} onValueChange={setSelectedTimeSlot}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a time slot" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSlots.map((slot) => (
                          <SelectItem key={slot} value={slot}>
                            {slot}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              
              <div className="pt-2">
                <Button type="submit" disabled={loading || !selectedDate || !selectedTimeSlot}>
                  {loading ? "Processing..." : "Finish my booking"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default LeadForm;
