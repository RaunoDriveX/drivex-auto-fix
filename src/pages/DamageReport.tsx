import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import glassifyLogo from "@/assets/glassify-logo.svg";
import windshieldFrontIcon from "@/assets/windshield-front.svg";
import windshieldRearIcon from "@/assets/windshield-rear.svg";
import windshieldSideIcon from "@/assets/windshield-side.svg";
import { CircleDot, Zap, Layers, ArrowLeft, CheckCircle, Mail, Phone, MessageCircle, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { DamageReportStepper, DamageReportStep } from "@/components/customer/DamageReportStepper";

type GlassLocation = "front" | "side" | "rear";
type DamageType = "chip" | "crack" | "multiple";
type VehicleType = "car" | "van";
type ContactMethod = "email" | "phone" | "whatsapp";

interface SubmissionData {
  appointmentId: string;
  shortCode: string;
}

const DamageReport = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('marketing');
  
  const [glassLocation, setGlassLocation] = useState<GlassLocation>("front");
  const [damageType, setDamageType] = useState<DamageType>("chip");
  const [vehicleType, setVehicleType] = useState<VehicleType>("car");
  const [licensePlate, setLicensePlate] = useState("");
  const [insuredName, setInsuredName] = useState("");
  const [selectedInsurer, setSelectedInsurer] = useState("");
  const [insurerOptions, setInsurerOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [customerStreet, setCustomerStreet] = useState("");
  const [customerCity, setCustomerCity] = useState("");
  const [customerPostalCode, setCustomerPostalCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showContactSelection, setShowContactSelection] = useState(false);
  const [submissionData, setSubmissionData] = useState<SubmissionData | null>(null);
  const [contactMethod, setContactMethod] = useState<ContactMethod>("email");
  const [contactValue, setContactValue] = useState("");

  // Hardcoded common insurers
  const hardcodedInsurers = [
    { id: 'allianz', name: 'Allianz' },
    { id: 'axa', name: 'AXA' },
    { id: 'hdi', name: 'HDI' },
    { id: 'huk-coburg', name: 'HUK-COBURG' },
    { id: 'ergo', name: 'ERGO' },
    { id: 'zurich', name: 'Zurich' },
    { id: 'devk', name: 'DEVK' },
    { id: 'vgh', name: 'VGH' },
  ];

  // Fetch insurers from database
  useEffect(() => {
    const fetchInsurers = async () => {
      const { data, error } = await supabase
        .from('insurer_profiles')
        .select('id, insurer_name')
        .order('insurer_name');

      if (!error && data) {
        const dbInsurers = data.map(i => ({ id: i.id, name: i.insurer_name }));
        // Merge hardcoded with database insurers, avoiding duplicates
        const allInsurers = [...hardcodedInsurers];
        dbInsurers.forEach(dbIns => {
          if (!allInsurers.some(h => h.name.toLowerCase() === dbIns.name.toLowerCase())) {
            allInsurers.push(dbIns);
          }
        });
        setInsurerOptions(allInsurers.sort((a, b) => a.name.localeCompare(b.name)));
      } else {
        setInsurerOptions(hardcodedInsurers);
      }
    };
    fetchInsurers();
  }, []);

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
    
    if (!licensePlate.trim() || !insuredName.trim() || !selectedInsurer || !customerStreet.trim() || !customerCity.trim() || !customerPostalCode.trim()) {
      toast.error(t('damage_report.validation_error'));
      return;
    }

    const selectedInsurerData = insurerOptions.find(i => i.id === selectedInsurer);

    setIsSubmitting(true);

    try {
      // Create appointment record in Supabase
      const { data, error } = await supabase
        .from('appointments')
        .insert({
          tracking_token: token,
          customer_name: insuredName.trim(),
          customer_email: '', // Will be collected later
          customer_street: customerStreet.trim(),
          customer_city: customerCity.trim(),
          customer_postal_code: customerPostalCode.trim(),
          shop_id: 'pending', // Will be assigned when insurance selects shops
          shop_name: 'Pending Assignment',
          service_type: getServiceType(glassLocation),
          damage_type: getDamageTypeValue(damageType),
          vehicle_info: {
            license_plate: licensePlate.trim().toUpperCase(),
            vehicle_type: vehicleType
          },
          status: 'pending',
          is_insurance_claim: true, // Insurance will assign shops
          insurer_name: selectedInsurerData?.name || '',
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

      // Show contact selection instead of navigating directly
      setSubmissionData({
        appointmentId: data.id,
        shortCode: data.short_code
      });
      setShowContactSelection(true);
      setIsSubmitting(false);
    } catch (error) {
      console.error('Error submitting damage report:', error);
      toast.error(t('damage_report.submit_error'));
      setIsSubmitting(false);
    }
  };

  const handleContactSubmit = async () => {
    if (!submissionData) return;

    // Update the appointment with contact preference
    const updateData: Record<string, string> = {
      preferred_contact_method: contactMethod
    };

    if (contactMethod === 'email') {
      updateData.customer_email = contactValue;
    } else if (contactMethod === 'phone' || contactMethod === 'whatsapp') {
      updateData.customer_phone = contactValue;
    }

    const { error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', submissionData.appointmentId);

    if (error) {
      console.error('Error updating contact info:', error);
      toast.error(t('damage_report.contact_update_error'));
      return;
    }

    // Navigate to confirmation page
    navigate(`/damage-report/${token}/confirmation`, {
      state: {
        appointmentId: submissionData.appointmentId,
        shortCode: submissionData.shortCode,
        glassLocation,
        damageType,
        vehicleType,
        licensePlate: licensePlate.trim().toUpperCase(),
        insuredName: insuredName.trim()
      }
    });
  };

  const getContactPlaceholder = () => {
    switch (contactMethod) {
      case 'email': return 'email@example.com';
      case 'phone': return '+49 123 456789';
      case 'whatsapp': return '+49 123 456789';
    }
  };

  const getContactInputType = () => {
    return contactMethod === 'email' ? 'email' : 'tel';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{t('damage_report.back_home')}</span>
          </Button>
          <img src={glassifyLogo} alt="Glassify" className="h-8" />
          <LanguageSwitcher />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8 max-w-4xl mx-auto">
          {/* Main Content */}
          <div className="flex-1 max-w-2xl">
        {showContactSelection ? (
          // Contact Selection View
          <div className="space-y-8">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="w-16 h-16 text-green-500" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                {t('damage_report.thank_you_title')}
              </h1>
              <p className="text-muted-foreground mt-2">
                {t('damage_report.thank_you_subtitle')}
              </p>
            </div>

            {/* Contact Method Selection */}
            <Card className="border-2">
              <CardContent className="p-6">
                <Label className="text-base font-medium mb-4 block text-center">
                  {t('damage_report.contact_question')}
                </Label>
                <RadioGroup
                  value={contactMethod}
                  onValueChange={(value) => {
                    setContactMethod(value as ContactMethod);
                    setContactValue("");
                  }}
                  className="grid grid-cols-3 gap-4 mb-6"
                >
                  <Label htmlFor="contact-email" className="cursor-pointer">
                    <Card className={`transition-all ${contactMethod === 'email' ? 'border-primary ring-2 ring-primary bg-primary/5' : 'hover:border-primary/50'}`}>
                      <CardContent className="p-4 flex flex-col items-center gap-2">
                        <RadioGroupItem value="email" id="contact-email" className="sr-only" />
                        <Mail className="w-8 h-8 text-primary" />
                        <span className="text-sm font-medium">Email</span>
                      </CardContent>
                    </Card>
                  </Label>

                  <Label htmlFor="contact-phone" className="cursor-pointer">
                    <Card className={`transition-all ${contactMethod === 'phone' ? 'border-primary ring-2 ring-primary bg-primary/5' : 'hover:border-primary/50'}`}>
                      <CardContent className="p-4 flex flex-col items-center gap-2">
                        <RadioGroupItem value="phone" id="contact-phone" className="sr-only" />
                        <Phone className="w-8 h-8 text-primary" />
                        <span className="text-sm font-medium">{t('damage_report.mobile_phone')}</span>
                      </CardContent>
                    </Card>
                  </Label>

                  <Label htmlFor="contact-whatsapp" className="cursor-pointer">
                    <Card className={`transition-all ${contactMethod === 'whatsapp' ? 'border-primary ring-2 ring-primary bg-primary/5' : 'hover:border-primary/50'}`}>
                      <CardContent className="p-4 flex flex-col items-center gap-2">
                        <RadioGroupItem value="whatsapp" id="contact-whatsapp" className="sr-only" />
                        <MessageCircle className="w-8 h-8 text-primary" />
                        <span className="text-sm font-medium">WhatsApp</span>
                      </CardContent>
                    </Card>
                  </Label>
                </RadioGroup>

                <Input
                  type={getContactInputType()}
                  value={contactValue}
                  onChange={(e) => setContactValue(e.target.value)}
                  placeholder={getContactPlaceholder()}
                  className="text-lg h-12"
                />
              </CardContent>
            </Card>

            <Button
              size="lg"
              className="w-full h-14 text-lg bg-brand hover:bg-brand/90"
              onClick={handleContactSubmit}
              disabled={!contactValue.trim()}
            >
              {t('damage_report.confirm_send')}
            </Button>
          </div>
        ) : (
          // Form View
          <>
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
                    <div className="w-16 h-16 flex items-center justify-center">
                      <img src={windshieldFrontIcon} alt="Front windshield" className="w-16 h-16" />
                    </div>
                    <span className="text-sm font-medium text-center">{t('damage_report.front_windshield')}</span>
                  </CardContent>
                </Card>
              </Label>

              <Label htmlFor="glass-side" className="cursor-pointer">
                <Card className={`transition-all ${glassLocation === 'side' ? 'border-primary ring-2 ring-primary' : 'hover:border-primary/50'}`}>
                  <CardContent className="p-4 flex flex-col items-center gap-2">
                    <RadioGroupItem value="side" id="glass-side" className="sr-only" />
                    <div className="w-16 h-16 flex items-center justify-center">
                      <img src={windshieldSideIcon} alt="Side window" className="w-16 h-16" />
                    </div>
                    <span className="text-sm font-medium text-center">{t('damage_report.side_window')}</span>
                  </CardContent>
                </Card>
              </Label>

              <Label htmlFor="glass-rear" className="cursor-pointer">
                <Card className={`transition-all ${glassLocation === 'rear' ? 'border-primary ring-2 ring-primary' : 'hover:border-primary/50'}`}>
                  <CardContent className="p-4 flex flex-col items-center gap-2">
                    <RadioGroupItem value="rear" id="glass-rear" className="sr-only" />
                    <div className="w-16 h-16 flex items-center justify-center">
                      <img src={windshieldRearIcon} alt="Rear windshield" className="w-16 h-16" />
                    </div>
                    <span className="text-sm font-medium text-center">{t('damage_report.rear_windshield')}</span>
                  </CardContent>
                </Card>
              </Label>
            </RadioGroup>
          </div>

          {/* Damage Type Selection - Only shown for front windshield */}
          {glassLocation === 'front' && (
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
          )}

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

          {/* Collapsible Insurance & Address Section */}
          <Collapsible className="space-y-4">
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between h-12 text-base font-medium border-success hover:bg-success/10"
              >
                {t('damage_report.insurance_and_address', 'Insurance Company & Your Address')}
                <ChevronDown className="h-5 w-5 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-6 pt-2">
              {/* Insurance Company */}
              <div className="space-y-2">
                <Label htmlFor="insurer-select" className="text-lg font-semibold">
                  {t('damage_report.insurance_company')}
                </Label>
                <Select value={selectedInsurer} onValueChange={setSelectedInsurer}>
                  <SelectTrigger id="insurer-select" className="text-lg h-12">
                    <SelectValue placeholder={t('damage_report.select_insurance')} />
                  </SelectTrigger>
                  <SelectContent>
                    {insurerOptions.map((insurer) => (
                      <SelectItem key={insurer.id} value={insurer.id}>
                        {insurer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Customer Address Section */}
              <div className="space-y-4">
                <div>
                  <Label className="text-lg font-semibold">{t('damage_report.customer_address')}</Label>
                  <p className="text-sm text-muted-foreground mt-1">{t('damage_report.customer_address_hint')}</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="customer-street">{t('damage_report.street')}</Label>
                  <Input
                    id="customer-street"
                    value={customerStreet}
                    onChange={(e) => setCustomerStreet(e.target.value)}
                    placeholder={t('damage_report.street_placeholder')}
                    className="text-lg h-12"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customer-postal-code">{t('damage_report.postal_code')}</Label>
                    <Input
                      id="customer-postal-code"
                      value={customerPostalCode}
                      onChange={(e) => setCustomerPostalCode(e.target.value)}
                      placeholder={t('damage_report.postal_code_placeholder')}
                      className="text-lg h-12"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customer-city">{t('damage_report.city')}</Label>
                    <Input
                      id="customer-city"
                      value={customerCity}
                      onChange={(e) => setCustomerCity(e.target.value)}
                      placeholder={t('damage_report.city_placeholder')}
                      className="text-lg h-12"
                      required
                    />
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

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
          </>
        )}
          </div>

          {/* Timeline Sidebar */}
          <aside className="hidden lg:block w-48 shrink-0 pt-4">
            <div className="sticky top-8">
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">
                Progress
              </h3>
              <DamageReportStepper currentStep={showContactSelection ? 'contact' : 'reporting'} />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default DamageReport;
