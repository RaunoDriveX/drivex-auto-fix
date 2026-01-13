import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import glassifyLogo from "@/assets/glassify-logo.svg";
import { Car, Square, CircleDot, Zap, AlertTriangle, Layers } from "lucide-react";

type GlassLocation = "front" | "side" | "rear";
type DamageType = "chip" | "crack" | "multiple";
type VehicleType = "car" | "van";

const DamageReport = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('marketing');
  
  const [glassLocation, setGlassLocation] = useState<GlassLocation>("front");
  const [damageType, setDamageType] = useState<DamageType>("chip");
  const [vehicleType, setVehicleType] = useState<VehicleType>("car");
  const [licensePlate, setLicensePlate] = useState("");
  const [insuredName, setInsuredName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getServiceType = (location: GlassLocation) => {
    switch (location) {
      case "front": return "windshield";
      case "side": return "side_window";
      case "rear": return "rear_window";
      default: return "windshield";
    }
  };

  const getDamageTypeValue = (type: DamageType) => {
    switch (type) {
      case "chip": return "stone_chip";
      case "crack": return "crack";
      case "multiple": return "multiple_damages";
      default: return "stone_chip";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!licensePlate.trim() || !insuredName.trim()) {
      toast.error(t('damage_report.validation_error'));
      return;
    }

    setIsSubmitting(true);

    try {
      // Create appointment record in Supabase
      const { data, error } = await supabase
        .from('appointments')
        .insert({
          tracking_token: token,
          customer_name: insuredName.trim(),
          customer_email: '', // Will be collected later
          shop_id: 'pending', // Will be assigned when a shop accepts
          shop_name: 'Pending Assignment',
          service_type: getServiceType(glassLocation),
          damage_type: getDamageTypeValue(damageType),
          vehicle_info: {
            license_plate: licensePlate.trim().toUpperCase(),
            vehicle_type: vehicleType
          },
          status: 'pending',
          appointment_date: new Date().toISOString().split('T')[0],
          appointment_time: '09:00'
        })
        .select('id, short_code')
        .single();

      if (error) {
        console.error('Error creating appointment:', error);
        toast.error(t('damage_report.submit_error'));
        setIsSubmitting(false);
        return;
      }

      // Navigate to confirmation page with the appointment data
      navigate(`/damage-report/${token}/confirmation`, {
        state: {
          appointmentId: data.id,
          shortCode: data.short_code,
          glassLocation,
          damageType,
          vehicleType,
          licensePlate: licensePlate.trim().toUpperCase(),
          insuredName: insuredName.trim()
        }
      });
    } catch (error) {
      console.error('Error submitting damage report:', error);
      toast.error(t('damage_report.submit_error'));
      setIsSubmitting(false);
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

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {t('damage_report.title')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('damage_report.subtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Glass Location Selection */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">{t('damage_report.glass_location')}</Label>
            <RadioGroup
              value={glassLocation}
              onValueChange={(value) => setGlassLocation(value as GlassLocation)}
              className="grid grid-cols-3 gap-4"
            >
              <Label htmlFor="glass-front" className="cursor-pointer">
                <Card className={`transition-all ${glassLocation === 'front' ? 'border-primary ring-2 ring-primary' : 'hover:border-primary/50'}`}>
                  <CardContent className="p-4 flex flex-col items-center gap-2">
                    <RadioGroupItem value="front" id="glass-front" className="sr-only" />
                    <div className="w-16 h-16 flex items-center justify-center text-primary">
                      <Car className="w-12 h-12" />
                    </div>
                    <span className="text-sm font-medium text-center">{t('damage_report.front_windshield')}</span>
                  </CardContent>
                </Card>
              </Label>

              <Label htmlFor="glass-side" className="cursor-pointer">
                <Card className={`transition-all ${glassLocation === 'side' ? 'border-primary ring-2 ring-primary' : 'hover:border-primary/50'}`}>
                  <CardContent className="p-4 flex flex-col items-center gap-2">
                    <RadioGroupItem value="side" id="glass-side" className="sr-only" />
                    <div className="w-16 h-16 flex items-center justify-center text-primary">
                      <Square className="w-12 h-12" />
                    </div>
                    <span className="text-sm font-medium text-center">{t('damage_report.side_window')}</span>
                  </CardContent>
                </Card>
              </Label>

              <Label htmlFor="glass-rear" className="cursor-pointer">
                <Card className={`transition-all ${glassLocation === 'rear' ? 'border-primary ring-2 ring-primary' : 'hover:border-primary/50'}`}>
                  <CardContent className="p-4 flex flex-col items-center gap-2">
                    <RadioGroupItem value="rear" id="glass-rear" className="sr-only" />
                    <div className="w-16 h-16 flex items-center justify-center text-primary">
                      <Car className="w-12 h-12 rotate-180" />
                    </div>
                    <span className="text-sm font-medium text-center">{t('damage_report.rear_windshield')}</span>
                  </CardContent>
                </Card>
              </Label>
            </RadioGroup>
          </div>

          {/* Damage Type Selection */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">{t('damage_report.damage_type')}</Label>
            <RadioGroup
              value={damageType}
              onValueChange={(value) => setDamageType(value as DamageType)}
              className="grid grid-cols-3 gap-4"
            >
              <Label htmlFor="damage-chip" className="cursor-pointer">
                <Card className={`transition-all ${damageType === 'chip' ? 'border-primary ring-2 ring-primary' : 'hover:border-primary/50'}`}>
                  <CardContent className="p-4 flex flex-col items-center gap-2">
                    <RadioGroupItem value="chip" id="damage-chip" className="sr-only" />
                    <div className="w-16 h-16 flex items-center justify-center text-primary">
                      <CircleDot className="w-12 h-12" />
                    </div>
                    <span className="text-sm font-medium text-center">{t('damage_report.stone_chip')}</span>
                  </CardContent>
                </Card>
              </Label>

              <Label htmlFor="damage-crack" className="cursor-pointer">
                <Card className={`transition-all ${damageType === 'crack' ? 'border-primary ring-2 ring-primary' : 'hover:border-primary/50'}`}>
                  <CardContent className="p-4 flex flex-col items-center gap-2">
                    <RadioGroupItem value="crack" id="damage-crack" className="sr-only" />
                    <div className="w-16 h-16 flex items-center justify-center text-primary">
                      <Zap className="w-12 h-12" />
                    </div>
                    <span className="text-sm font-medium text-center">{t('damage_report.crack')}</span>
                  </CardContent>
                </Card>
              </Label>

              <Label htmlFor="damage-multiple" className="cursor-pointer">
                <Card className={`transition-all ${damageType === 'multiple' ? 'border-primary ring-2 ring-primary' : 'hover:border-primary/50'}`}>
                  <CardContent className="p-4 flex flex-col items-center gap-2">
                    <RadioGroupItem value="multiple" id="damage-multiple" className="sr-only" />
                    <div className="w-16 h-16 flex items-center justify-center text-primary">
                      <Layers className="w-12 h-12" />
                    </div>
                    <span className="text-sm font-medium text-center">{t('damage_report.multiple_damages')}</span>
                  </CardContent>
                </Card>
              </Label>
            </RadioGroup>
          </div>

          {/* Vehicle Type Selection */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">{t('damage_report.vehicle_type')}</Label>
            <div className="flex gap-4">
              <Button
                type="button"
                variant={vehicleType === 'car' ? 'default' : 'outline'}
                className="flex-1 h-12"
                onClick={() => setVehicleType('car')}
              >
                {t('damage_report.car')}
              </Button>
              <Button
                type="button"
                variant={vehicleType === 'van' ? 'default' : 'outline'}
                className="flex-1 h-12"
                onClick={() => setVehicleType('van')}
              >
                {t('damage_report.van')}
              </Button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="license-plate" className="text-lg font-semibold">
                {t('damage_report.license_plate')}
              </Label>
              <Input
                id="license-plate"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                placeholder="ABC-123"
                className="text-lg h-12"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="insured-name" className="text-lg font-semibold">
                {t('damage_report.insured_name')}
              </Label>
              <Input
                id="insured-name"
                value={insuredName}
                onChange={(e) => setInsuredName(e.target.value)}
                placeholder={t('damage_report.insured_name_placeholder')}
                className="text-lg h-12"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            size="lg"
            className="w-full h-14 text-lg bg-brand hover:bg-brand/90"
            disabled={isSubmitting}
          >
            {isSubmitting ? t('damage_report.submitting') : t('damage_report.submit')}
          </Button>
        </form>
      </main>
    </div>
  );
};

export default DamageReport;
