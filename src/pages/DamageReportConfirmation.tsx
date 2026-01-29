import { useTranslation } from "react-i18next";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Copy, Search } from "lucide-react";
import { toast } from "sonner";
import glassifyLogo from "@/assets/glassify-logo.svg";
import { DamageReportStepper } from "@/components/customer/DamageReportStepper";

interface LocationState {
  appointmentId: string;
  shortCode: string;
  glassLocation: string;
  damageType: string;
  vehicleType: string;
  licensePlate: string;
  insuredName: string;
}

const DamageReportConfirmation = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation('marketing');
  
  const state = location.state as LocationState | null;

  // If no state, redirect back to home
  if (!state) {
    navigate('/');
    return null;
  }

  const { shortCode, glassLocation, damageType, vehicleType, licensePlate, insuredName } = state;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shortCode);
      toast.success(t('confirmation.copied'));
    } catch (err) {
      toast.error(t('confirmation.copy_failed'));
    }
  };

  const getGlassLocationLabel = (loc: string) => {
    switch (loc) {
      case 'front': return t('damage_report.front_windshield');
      case 'side': return t('damage_report.side_window');
      case 'rear': return t('damage_report.rear_windshield');
      default: return loc;
    }
  };

  const getDamageTypeLabel = (type: string) => {
    switch (type) {
      case 'chip': return t('damage_report.stone_chip');
      case 'crack': return t('damage_report.crack');
      case 'multiple': return t('damage_report.multiple_damages');
      default: return type;
    }
  };

  const getVehicleTypeLabel = (type: string) => {
    switch (type) {
      case 'car': return t('damage_report.car');
      case 'van': return t('damage_report.van');
      default: return type;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-center">
          <img src={glassifyLogo} alt="Glassify" className="h-8" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8 max-w-4xl mx-auto">
          {/* Main Content */}
          <div className="flex-1 max-w-2xl">
            {/* Success Message */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <CheckCircle className="w-16 h-16 text-green-500" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                {t('confirmation.success_title')}
              </h1>
              <p className="text-muted-foreground mt-2">
                {t('confirmation.success_description')}
              </p>
            </div>

            {/* Job Tracking ID */}
            <Card className="mb-8 border-2 border-primary">
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  {t('confirmation.your_job_id')}
                </p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-4xl md:text-5xl font-mono font-bold text-primary tracking-wider">
                    {shortCode}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyToClipboard}
                    className="flex-shrink-0"
                  >
                    <Copy className="w-5 h-5" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  {t('confirmation.save_id_note')}
                </p>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card className="mb-8">
              <CardContent className="p-6">
                <h2 className="font-semibold text-lg mb-4">{t('confirmation.summary')}</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('damage_report.glass_location')}:</span>
                    <span className="font-medium">{getGlassLocationLabel(glassLocation)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('damage_report.damage_type')}:</span>
                    <span className="font-medium">{getDamageTypeLabel(damageType)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('damage_report.vehicle_type')}:</span>
                    <span className="font-medium">{getVehicleTypeLabel(vehicleType)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('damage_report.license_plate')}:</span>
                    <span className="font-medium">{licensePlate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('damage_report.insured_name')}:</span>
                    <span className="font-medium">{insuredName}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-4">
              <Button
                size="lg"
                className="w-full h-14 text-lg bg-brand hover:bg-brand/90"
                onClick={() => navigate('/')}
              >
                {t('confirmation.close', 'Close')}
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                className="w-full h-14 text-lg"
                onClick={() => navigate(`/track/${shortCode}`)}
              >
                <Search className="w-5 h-5 mr-2" />
                {t('confirmation.track_job')}
              </Button>
            </div>
          </div>

          {/* Timeline Sidebar */}
          <aside className="hidden lg:block w-48 shrink-0 pt-4">
            <div className="sticky top-8">
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">
                Progress
              </h3>
              <DamageReportStepper currentStep="confirmation" />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default DamageReportConfirmation;
