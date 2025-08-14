import { AlertTriangle, Info, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface AdasCalibrationAlertProps {
  requiresCalibration: boolean;
  calibrationReason?: string;
  shopHasCapability: boolean;
  onDecline?: () => void;
  variant?: "warning" | "info";
}

export const AdasCalibrationAlert = ({
  requiresCalibration,
  calibrationReason,
  shopHasCapability,
  onDecline,
  variant = "warning"
}: AdasCalibrationAlertProps) => {
  if (!requiresCalibration) return null;

  const isWarning = !shopHasCapability;
  const alertVariant = isWarning ? "destructive" : variant;

  return (
    <Alert className={`border-l-4 ${isWarning ? 'border-l-destructive' : 'border-l-primary'}`}>
      <div className="flex items-start gap-3">
        {isWarning ? (
          <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
        ) : (
          <Info className="h-5 w-5 text-primary mt-0.5" />
        )}
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant={isWarning ? "destructive" : "secondary"}>
              ADAS Calibration Required
            </Badge>
          </div>
          
          <AlertDescription className="text-sm">
            {calibrationReason || "This vehicle requires ADAS calibration after windshield work."}
          </AlertDescription>
          
          {!shopHasCapability && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-destructive">
                Your shop doesn't have ADAS calibration capability configured.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDecline}
                  className="text-destructive border-destructive hover:bg-destructive/10"
                >
                  <X className="w-4 h-4 mr-1" />
                  Decline Job
                </Button>
                <Button variant="outline" size="sm">
                  Refer to Partner
                </Button>
              </div>
            </div>
          )}
          
          {shopHasCapability && (
            <p className="text-sm text-muted-foreground">
              ✓ Your shop has ADAS calibration capability
            </p>
          )}
        </div>
      </div>
    </Alert>
  );
};