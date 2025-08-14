import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Package, Truck, Calendar } from "lucide-react";

interface PartsFitmentData {
  requires_oem: boolean;
  calibration_sensitive: boolean;
  reason: string;
  part_specifications: any;
  requirement_id: string | null;
}

interface PartsFitmentAlertProps {
  vehicleInfo: {
    make: string;
    model?: string;
    year: number;
  };
  damageType: string;
  jobOfferId: string;
  shopId: string;
  onPartsSourced?: () => void;
}

const PartsFitmentAlert = ({ vehicleInfo, damageType, jobOfferId, shopId, onPartsSourced }: PartsFitmentAlertProps) => {
  const [fitmentData, setFitmentData] = useState<PartsFitmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSourcingDialog, setShowSourcingDialog] = useState(false);
  const [sourcingRequest, setSourcingRequest] = useState({
    requested_delivery_date: '',
    notes: ''
  });
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkPartsFitment();
  }, [vehicleInfo, damageType]);

  const checkPartsFitment = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('check_oem_requirements', {
        _vehicle_make: vehicleInfo.make,
        _vehicle_model: vehicleInfo.model || null,
        _vehicle_year: vehicleInfo.year,
        _damage_type: damageType
      });

      if (error) throw error;
      setFitmentData(data as unknown as PartsFitmentData);
    } catch (error) {
      console.error('Error checking parts fitment:', error);
      toast({
        title: "Error",
        description: "Failed to check parts requirements",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSourcingRequest = async () => {
    try {
      setSubmittingRequest(true);

      const { error } = await supabase
        .from('parts_sourcing_requests')
        .insert({
          shop_id: shopId,
          job_offer_id: jobOfferId,
          vehicle_make: vehicleInfo.make,
          vehicle_model: vehicleInfo.model,
          vehicle_year: vehicleInfo.year,
          part_type: 'windshield',
          oem_required: fitmentData?.requires_oem || false,
          requested_delivery_date: sourcingRequest.requested_delivery_date || null,
          notes: sourcingRequest.notes
        });

      if (error) throw error;

      toast({
        title: "Request Submitted",
        description: "Parts sourcing request submitted successfully. You'll receive a quote within 2 hours."
      });

      setShowSourcingDialog(false);
      onPartsSourced?.();
    } catch (error) {
      console.error('Error submitting sourcing request:', error);
      toast({
        title: "Error",
        description: "Failed to submit parts sourcing request",
        variant: "destructive"
      });
    } finally {
      setSubmittingRequest(false);
    }
  };

  const formatPartSpecifications = (specs: any) => {
    if (!specs || typeof specs !== 'object') return null;
    
    return (
      <div className="mt-2 space-y-1">
        {specs.supplier && (
          <div className="text-xs text-muted-foreground">
            <strong>Preferred Supplier:</strong> {specs.supplier}
          </div>
        )}
        {specs.alternatives && (
          <div className="text-xs text-muted-foreground">
            <strong>Alternatives:</strong> {specs.alternatives.join(', ')}
          </div>
        )}
        {specs.lead_time_days && (
          <div className="text-xs text-muted-foreground">
            <strong>Typical Lead Time:</strong> {specs.lead_time_days} days
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-3 border border-border rounded-lg animate-pulse">
        <div className="w-4 h-4 bg-muted rounded"></div>
        <div className="h-4 bg-muted rounded flex-1"></div>
      </div>
    );
  }

  if (!fitmentData) return null;

  return (
    <div className="space-y-3">
      {fitmentData.requires_oem && (
        <Alert className="border-destructive/50 bg-destructive/10">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertTitle className="text-destructive">OEM Parts Required</AlertTitle>
          <AlertDescription className="text-foreground">
            <div className="space-y-2">
              <p>{fitmentData.reason}</p>
              {formatPartSpecifications(fitmentData.part_specifications)}
              <div className="flex gap-2 mt-3">
                <Badge variant="destructive" className="text-xs">
                  <Package className="h-3 w-3 mr-1" />
                  OEM Required
                </Badge>
                {fitmentData.calibration_sensitive && (
                  <Badge variant="outline" className="text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Calibration Critical
                  </Badge>
                )}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {fitmentData.calibration_sensitive && !fitmentData.requires_oem && (
        <Alert className="border-amber-500/50 bg-amber-500/10">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-700">Calibration Sensitive</AlertTitle>
          <AlertDescription className="text-foreground">
            <div className="space-y-2">
              <p>{fitmentData.reason}</p>
              {formatPartSpecifications(fitmentData.part_specifications)}
              <Badge variant="outline" className="text-xs mt-2">
                <AlertTriangle className="h-3 w-3 mr-1" />
                ADAS Calibration Required
              </Badge>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {(fitmentData.requires_oem || fitmentData.calibration_sensitive) && (
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" />
              Parts Sourcing
            </CardTitle>
            <CardDescription className="text-xs">
              Need help sourcing the right parts? We can help you find and order them.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Dialog open={showSourcingDialog} onOpenChange={setShowSourcingDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="w-full">
                  <Package className="h-4 w-4 mr-2" />
                  Request Parts Sourcing
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request Parts Sourcing</DialogTitle>
                  <DialogDescription>
                    We'll help you source the right parts for this {vehicleInfo.year} {vehicleInfo.make} {vehicleInfo.model}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-xs text-muted-foreground">Vehicle</Label>
                      <p className="font-medium">{vehicleInfo.year} {vehicleInfo.make} {vehicleInfo.model}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Part Type</Label>
                      <p className="font-medium">Windshield {fitmentData.requires_oem ? '(OEM)' : ''}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="delivery-date">Requested Delivery Date</Label>
                    <Input
                      id="delivery-date"
                      type="date"
                      value={sourcingRequest.requested_delivery_date}
                      onChange={(e) => setSourcingRequest(prev => ({
                        ...prev,
                        requested_delivery_date: e.target.value
                      }))}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Any specific requirements or preferences..."
                      value={sourcingRequest.notes}
                      onChange={(e) => setSourcingRequest(prev => ({
                        ...prev,
                        notes: e.target.value
                      }))}
                      rows={3}
                    />
                  </div>

                  <Alert>
                    <Calendar className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      We'll provide a quote within 2 hours and can typically deliver parts within 1-3 business days.
                    </AlertDescription>
                  </Alert>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowSourcingDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSourcingRequest} disabled={submittingRequest}>
                    {submittingRequest ? 'Submitting...' : 'Submit Request'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PartsFitmentAlert;