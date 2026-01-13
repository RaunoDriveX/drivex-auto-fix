import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Users, Building2, Zap, Shield, DollarSign, Clock, Smartphone, TrendingUp } from "lucide-react";

const WhyChooseUs = () => {
  const { t } = useTranslation('marketing');

  const practices = [
    {
      icon: Zap,
      title: t('why_choose_us.practices.ai_powered.title'),
      description: t('why_choose_us.practices.ai_powered.description'),
      benefit: t('why_choose_us.practices.ai_powered.benefit')
    },
    {
      icon: DollarSign,
      title: t('why_choose_us.practices.transparent.title'),
      description: t('why_choose_us.practices.transparent.description'),
      benefit: t('why_choose_us.practices.transparent.benefit')
    },
    {
      icon: Smartphone,
      title: t('why_choose_us.practices.mobile_first.title'),
      description: t('why_choose_us.practices.mobile_first.description'),
      benefit: t('why_choose_us.practices.mobile_first.benefit')
    }
  ];

  return (
    <section id="about" className="bg-gradient-to-b from-background to-muted/30 py-20">
      <div className="container mx-auto">
        
        {/* Main header */}
        <div className="text-center mb-20">
          <Badge variant="secondary" className="mb-6 px-6 py-3 text-sm font-medium">
            {t('why_choose_us.badge')}
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-8 leading-tight">
            {t('why_choose_us.title')}<br/>
            <span className="text-primary">{t('why_choose_us.title_highlight')}</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t('why_choose_us.description')}
          </p>
        </div>

        {/* Our practices */}
        <div className="grid md:grid-cols-3 gap-8">
          {practices.map((practice, index) => (
            <div key={practice.title} className="text-center group animate-fade-in" style={{ animationDelay: `${index * 150}ms` }}>
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-brand/10 to-brand/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <practice.icon className="h-10 w-10 text-brand" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">{practice.title}</h3>
              <p className="text-muted-foreground mb-4 leading-relaxed">{practice.description}</p>
              <div className="inline-flex items-center gap-2 text-sm text-primary font-medium px-4 py-2 bg-primary/5 rounded-full">
                <CheckCircle className="h-4 w-4" />
                {practice.benefit}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

// Separate component for customer segments
export const CustomerSegments = () => {
  const { t } = useTranslation('marketing');

  const individualBenefits = [
    t('why_choose_us.individual_benefits.fair_pricing'),
    t('why_choose_us.individual_benefits.mobile_repair'),
    t('why_choose_us.individual_benefits.real_time'),
    t('why_choose_us.individual_benefits.insurance_assist')
  ];

  const fleetBenefits = [
    t('why_choose_us.fleet_benefits.centralized'),
    t('why_choose_us.fleet_benefits.volume_discounts'),
    t('why_choose_us.fleet_benefits.priority'),
    t('why_choose_us.fleet_benefits.reporting'),
    t('why_choose_us.fleet_benefits.support')
  ];

  return (
    <section className="bg-background py-20">
      <div className="container mx-auto">
        {/* For individuals vs fleets */}
        <div className="grid lg:grid-cols-2 gap-12">
          
          {/* Individual drivers */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10">
            <CardHeader className="text-center pb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl mb-3">{t('why_choose_us.segments.individual_title')}</CardTitle>
              <p className="text-muted-foreground">
                {t('why_choose_us.segments.individual_desc')}
              </p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {individualBenefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{benefit}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 p-4 bg-blue-500/5 rounded-lg">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-semibold mb-1">
                  <Clock className="h-4 w-4" />
                  {t('why_choose_us.segments.avg_repair_time')}
                </div>
                <p className="text-sm text-muted-foreground">{t('why_choose_us.segments.same_day')}</p>
              </div>
            </CardContent>
          </Card>

          {/* Fleet owners */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/20 dark:to-orange-900/10">
            <CardHeader className="text-center pb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-500/10 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-orange-600" />
              </div>
              <CardTitle className="text-2xl mb-3">{t('why_choose_us.segments.fleet_title')}</CardTitle>
              <p className="text-muted-foreground">
                {t('why_choose_us.segments.fleet_desc')}
              </p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {fleetBenefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{benefit}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 p-4 bg-orange-500/5 rounded-lg">
                <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300 font-semibold mb-1">
                  <TrendingUp className="h-4 w-4" />
                  {t('why_choose_us.segments.cost_savings')}
                </div>
                <p className="text-sm text-muted-foreground">{t('why_choose_us.segments.vs_traditional')}</p>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </section>
  );
};

export default WhyChooseUs;
