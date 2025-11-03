import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { Clock, Car, DollarSign, User, Calendar as CalendarIcon, Plus, Edit } from "lucide-react";

interface CalendarEvent {
  id: string;
  type: 'appointment' | 'availability';
  date: string;
  time?: string;
  title: string;
  status?: string;
  customer_name?: string;
  service_type?: string;
  offered_price?: number;
  vehicle_info?: any;
  shop_name?: string;
  technician?: string;
  is_available?: boolean;
}

interface ShopCalendarViewProps {
  shopId: string;
}

const ShopCalendarView = ({ shopId }: ShopCalendarViewProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddingAvailability, setIsAddingAvailability] = useState(false);
  const [newAvailabilityTime, setNewAvailabilityTime] = useState("09:00");
  const { toast } = useToast();

  useEffect(() => {
    fetchCalendarData();
    
    // Subscribe to realtime updates for job offers and appointments
    const subscription = supabase
      .channel('calendar-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'job_offers', filter: `shop_id=eq.${shopId}` },
        () => {
          fetchCalendarData();
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'appointments', filter: `shop_id=eq.${shopId}` },
        () => {
          fetchCalendarData();
        }
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [shopId, selectedDate]);

  const fetchCalendarData = async () => {
    setLoading(true);
    try {
      const monthStart = startOfMonth(selectedDate);
      const monthEnd = endOfMonth(selectedDate);

      // Fetch job offers for this shop
      const { data: jobOffers, error: jobOffersError } = await supabase
        .from('job_offers')
        .select(`
          *,
          appointments (
            customer_name,
            customer_email,
            service_type,
            appointment_date,
            appointment_time,
            damage_type,
            vehicle_info
          )
        `)
        .eq('shop_id', shopId)
        .eq('status', 'offered')
        .gte('appointments.appointment_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('appointments.appointment_date', format(monthEnd, 'yyyy-MM-dd'));

      if (jobOffersError) throw jobOffersError;

      // Fetch accepted appointments
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          *,
          job_offers!inner (
            id,
            status,
            offered_price,
            shop_id
          )
        `)
        .eq('job_offers.shop_id', shopId)
        .eq('job_offers.status', 'accepted')
        .gte('appointment_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('appointment_date', format(monthEnd, 'yyyy-MM-dd'));

      if (appointmentsError) throw appointmentsError;

      // Fetch shop availability
      const { data: availability, error: availabilityError } = await supabase
        .from('shop_availability')
        .select('*')
        .eq('shop_id', shopId)
        .gte('date', format(monthStart, 'yyyy-MM-dd'))
        .lte('date', format(monthEnd, 'yyyy-MM-dd'));

      if (availabilityError) throw availabilityError;

      // Transform job offers to events
      const jobOfferEvents: CalendarEvent[] = (jobOffers || [])
        .filter(jo => jo.appointments !== null)
        .map(jo => ({
          id: jo.id,
          type: 'appointment',
          date: jo.appointments.appointment_date,
          time: jo.appointments.appointment_time?.substring(0, 5),
          title: `${jo.appointments.service_type} - ${jo.appointments.customer_name}`,
          status: 'offered',
          customer_name: jo.appointments.customer_name,
          service_type: jo.appointments.service_type,
          offered_price: jo.offered_price,
          vehicle_info: jo.appointments.vehicle_info,
        }));

      // Transform accepted appointments to events
      const appointmentEvents: CalendarEvent[] = (appointments || []).map(apt => ({
        id: apt.id,
        type: 'appointment',
        date: apt.appointment_date,
        time: apt.appointment_time?.substring(0, 5),
        title: `${apt.service_type} - ${apt.customer_name}`,
        status: apt.job_offers?.[0]?.status || apt.status,
        customer_name: apt.customer_name,
        service_type: apt.service_type,
        offered_price: apt.job_offers?.[0]?.offered_price,
        vehicle_info: apt.vehicle_info,
        shop_name: apt.shop_name,
      }));

      // Transform availability to events
      const availabilityEvents: CalendarEvent[] = (availability || []).map(avail => ({
        id: `avail-${avail.id}`,
        type: 'availability',
        date: avail.date,
        time: format(new Date(`2000-01-01T${avail.time_slot}`), 'HH:mm'),
        title: avail.is_available ? 'Available' : 'Unavailable',
        is_available: avail.is_available,
      }));

      setEvents([...jobOfferEvents, ...appointmentEvents, ...availabilityEvents]);
    } catch (error: any) {
      console.error('Error fetching calendar data:', error);
      toast({
        title: "Error",
        description: "Failed to load calendar data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getEventColor = (event: CalendarEvent) => {
    if (event.type === 'appointment') {
      switch (event.status) {
        case 'pending': return 'bg-yellow-500';
        case 'offered': return 'bg-blue-500';
        case 'accepted': return 'bg-green-500';
        case 'declined': return 'bg-red-500';
        case 'completed': return 'bg-gray-500';
        default: return 'bg-primary';
      }
    } else {
      return event.is_available ? 'bg-green-200' : 'bg-gray-300';
    }
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => 
      isSameDay(parseISO(event.date), date)
    ).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  };

  const addAvailabilitySlot = async () => {
    if (!selectedDate) return;

    try {
      const { error } = await supabase
        .from('shop_availability')
        .insert({
          shop_id: shopId,
          date: format(selectedDate, 'yyyy-MM-dd'),
          time_slot: newAvailabilityTime,
          is_available: true
        });

      if (error) throw error;

      toast({
        title: "Availability added",
        description: "New availability slot has been added"
      });

      setIsAddingAvailability(false);
      setNewAvailabilityTime("09:00");
      fetchCalendarData();
    } catch (error: any) {
      console.error('Error adding availability:', error);
      toast({
        title: "Error",
        description: "Failed to add availability slot",
        variant: "destructive"
      });
    }
  };

  const toggleAvailability = async (eventId: string, currentStatus: boolean) => {
    try {
      const availId = eventId.replace('avail-', '');
      const { error } = await supabase
        .from('shop_availability')
        .update({ is_available: !currentStatus })
        .eq('id', availId);

      if (error) throw error;

      toast({
        title: "Availability updated",
        description: "Availability status has been changed"
      });

      fetchCalendarData();
    } catch (error: any) {
      console.error('Error updating availability:', error);
      toast({
        title: "Error",
        description: "Failed to update availability",
        variant: "destructive"
      });
    }
  };

  const confirmAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'confirmed' })
        .eq('id', appointmentId);

      if (error) throw error;

      toast({
        title: "Appointment confirmed",
        description: "The appointment has been confirmed"
      });

      fetchCalendarData();
    } catch (error: any) {
      console.error('Error confirming appointment:', error);
      toast({
        title: "Error",
        description: "Failed to confirm appointment",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Shop Calendar
          </CardTitle>
          <CardDescription>
            View and manage your availability, appointments, and job offers in calendar format
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">{/* Reduced gap from 6 to 4 and changed columns from 3 to 4 for better spacing */}
            {/* Calendar */}
            <div className="lg:col-span-3">{/* Increased calendar width */}
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border"
                modifiers={{
                  hasEvents: events.map(e => parseISO(e.date))
                }}
                modifiersStyles={{
                  hasEvents: {
                    fontWeight: 'bold',
                    textDecoration: 'underline',
                    textDecorationColor: 'hsl(var(--primary))',
                    textDecorationThickness: '2px',
                  }
                }}
                components={{
                  DayContent: ({ date }) => {
                    const dayEvents = getEventsForDate(date);
                    return (
                      <div className="relative w-full h-full min-h-[60px] p-1 flex flex-col">
                        <div className="text-sm font-medium text-center">
                          {date.getDate()}
                        </div>
                        <div className="space-y-1 mt-1 flex-1">
                          {dayEvents.slice(0, 2).map((event, index) => (
                            <div
                              key={`${event.id}-${index}`}
                              className={cn(
                                "text-xs px-1 py-0.5 rounded text-white truncate cursor-pointer",
                                getEventColor(event)
                              )}
                              onClick={() => {
                                setSelectedEvent(event);
                                setIsDialogOpen(true);
                              }}
                            >
                              {event.time} {event.title}
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <div className="text-xs text-muted-foreground">
                              +{dayEvents.length - 2} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                }}
              />
            </div>

            {/* Day Details - Reduced width */}
            <div className="lg:col-span-1 space-y-4">{/* Reduced from implicit span to explicit span-1 */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {format(selectedDate, 'MMMM d, yyyy')}
                </h3>
                <Button
                  size="sm"
                  onClick={() => setIsAddingAvailability(true)}
                  className="flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Add Slot
                </Button>
              </div>

              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {getEventsForDate(selectedDate).map((event, index) => (
                    <Card
                      key={`${event.id}-${index}`}
                      className="p-3 cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        setSelectedEvent(event);
                        setIsDialogOpen(true);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "w-3 h-3 rounded-full",
                              getEventColor(event)
                            )}
                          />
                          <div>
                            <div className="font-medium text-sm">
                              {event.time} - {event.title}
                            </div>
                            {event.type === 'appointment' && (
                              <div className="text-xs text-muted-foreground">
                                {event.service_type}
                              </div>
                            )}
                          </div>
                        </div>
                        {event.type === 'appointment' && event.status && (
                          <Badge variant="outline" className="text-xs">
                            {event.status}
                          </Badge>
                        )}
                      </div>
                    </Card>
                  ))}

                  {getEventsForDate(selectedDate).length === 0 && (
                    <div className="text-center text-muted-foreground py-4">
                      No events for this day
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 p-4 bg-muted/30 rounded-lg">
            <h4 className="font-medium mb-2">Legend</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span>Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span>Offered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>Accepted</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span>Declined</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-200" />
                <span>Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-300" />
                <span>Unavailable</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Event Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
            <DialogDescription>
              {selectedEvent?.date} at {selectedEvent?.time}
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4">
              {selectedEvent.type === 'appointment' ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedEvent.customer_name}</span>
                    </div>
                    {selectedEvent.offered_price && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">${selectedEvent.offered_price}</span>
                      </div>
                    )}
                  </div>

                  {selectedEvent.vehicle_info && (
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {selectedEvent.vehicle_info.make} {selectedEvent.vehicle_info.model}
                        {selectedEvent.vehicle_info.year && ` (${selectedEvent.vehicle_info.year})`}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{selectedEvent.status}</Badge>
                    {selectedEvent.status === 'offered' && (
                      <Button
                        size="sm"
                        onClick={() => confirmAppointment(selectedEvent.id)}
                      >
                        Confirm
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Status: {selectedEvent.is_available ? 'Available' : 'Unavailable'}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (selectedEvent.id.startsWith('avail-')) {
                          toggleAvailability(selectedEvent.id, selectedEvent.is_available || false);
                        }
                      }}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Toggle
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Availability Dialog */}
      <Dialog open={isAddingAvailability} onOpenChange={setIsAddingAvailability}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Availability Slot</DialogTitle>
            <DialogDescription>
              Add a new availability slot for {format(selectedDate, 'MMMM d, yyyy')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={newAvailabilityTime}
                onChange={(e) => setNewAvailabilityTime(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={addAvailabilitySlot} className="flex-1">
                Add Slot
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsAddingAvailability(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShopCalendarView;