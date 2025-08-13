import { useState } from "react";
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
import { CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import CallCenterCTA from "@/components/CallCenterCTA";

type LeadFormProps = {
  jobType?: "repair" | "replacement";
};

const LeadForm = ({ jobType = "repair" }: LeadFormProps) => {
  const [loading, setLoading] = useState(false);
  const [isInsuranceClaim, setIsInsuranceClaim] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");

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

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      (toast as any).success?.("Booking confirmed! We'll contact you soon.") || toast("Booking confirmed! We'll contact you soon.");
      (e.currentTarget as HTMLFormElement).reset();
      setSelectedDate(undefined);
      setSelectedTimeSlot("");
      window.location.hash = "lead-form";
    }, 600);
  };

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
                    <Label htmlFor="insurerName">Insurance company name</Label>
                    <Input id="insurerName" name="insurerName" placeholder="e.g. Allianz, AXA, etc." required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="policyNumber">Policy number</Label>
                    <Input id="policyNumber" name="policyNumber" placeholder="Your policy number" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="claimNumber">Claim number (if available)</Label>
                    <Input id="claimNumber" name="claimNumber" placeholder="Leave blank if not yet filed" />
                  </div>
                </>
              )}
              <div className="grid gap-2">
                <Label>Preferred contact</Label>
                <Select name="contact">
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="call">Call</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
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
