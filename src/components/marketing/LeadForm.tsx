import { useState } from "react";
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
import { CalendarIcon, Clock, CheckCircle2, Home } from "lucide-react";
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
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<{
    shopName: string;
    date: string;
    time: string;
    email: string;
  } | null>(null);

  const jobDuration = jobType === "repair" ? "30 minutes" : "2.5 hours";
  const jobDurationMinutes = jobType === "repair" ? 30 : 150;

  const generateTimeSlots = (date: Date) => {
    const slots = [];
    const startHour = 8; // 8 AM
    const endHour = 17; // 5 PM
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += jobDurationMinutes) {
        if (hour * 60 + minute + jobDurationMinutes <= endHour * 60) {
          const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          const endTime = `${Math.floor((hour * 60 + minute + jobDurationMinutes) / 60).toString().padStart(2, '0')}:${((hour * 60 + minute + jobDurationMinutes) % 60).toString().padStart(2, '0')}`;
          slots.push(`${time} - ${endTime}`);
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
          status: 'confirmed',
          total_cost: totalCost
        });

      if (appointmentError) {
        console.error('Error creating appointment:', appointmentError);
        toast.error("Failed to create appointment. Please try again.");
        return;
      }

      // Send confirmation email
      try {
        const { error: emailError } = await supabase.functions.invoke('send-confirmation-email', {
          body: {
            appointmentId: newAppointmentId,
            customerName,
            customerEmail,
            shopName,
            appointmentDate: format(selectedDate, 'yyyy-MM-dd'),
            appointmentTime: timeSlot,
            serviceType: jobType,
            totalCost: totalCost
          }
        });

        if (emailError) {
          console.error('Error sending confirmation email:', emailError);
        }

        // Update appointment to mark confirmation email as sent
        await supabase
          .from('appointments')
          .update({ confirmation_email_sent: true })
          .eq('id', newAppointmentId);
      } catch (emailError) {
        console.error('Error with confirmation email:', emailError);
      }

      // Trigger AI job allocation to shops
      try {
        const { error: allocationError } = await supabase.functions.invoke('allocate-job', {
          body: {
            appointmentId: newAppointmentId,
            serviceType: jobType,
            damageType: 'chip', // This could be determined from AI analysis
            vehicleInfo: {
              make: 'Toyota', // This would come from form or AI analysis
              model: 'Camry',
              year: 2020
            },
            customerLocation: {
              latitude: 52.3676, // Amsterdam coordinates as example
              longitude: 4.9041
            },
            ...(isInsurance && insurerName ? { insurerName } : {})
          }
        });

        if (allocationError) {
          console.error('Error in job allocation:', allocationError);
        } else {
          console.log('Job successfully allocated to eligible shops');
        }
      } catch (allocationError) {
        console.error('Error with job allocation:', allocationError);
      }

      toast.success("Booking confirmed! Check your email for confirmation details.");
      
      // Set booking complete state
      setBookingComplete(true);
      setBookingDetails({
        shopName,
        date: format(selectedDate, 'EEEE, MMMM d, yyyy'),
        time: timeSlot,
        email: customerEmail
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
