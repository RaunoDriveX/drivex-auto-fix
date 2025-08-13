import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Users, Building2, Zap, Shield, DollarSign, Clock, Smartphone, TrendingUp } from "lucide-react";

const WhyChooseUs = () => {
  const practices = [
    {
      icon: Zap,
      title: "Lightning-Fast AI Triage",
      description: "Our AI analyzes damage in seconds, not hours. Get instant recommendations for repair vs. replacement.",
      benefit: "Save time and get back on the road faster"
    },
    {
      icon: DollarSign,
      title: "Transparent Pricing",
      description: "See upfront costs from multiple shops. No hidden fees, no surprises. Compare and choose what works for you.",
      benefit: "Make informed decisions with full price visibility"
    },
    {
      icon: Shield,
      title: "Vetted Network",
      description: "Only certified, top-rated repair shops make it into our network. Quality guaranteed, every time.",
      benefit: "Peace of mind with every repair"
    },
    {
      icon: Smartphone,
      title: "Mobile-First Experience",
      description: "Everything happens on your phone. Report damage, get quotes, book appointments - all in minutes.",
      benefit: "Convenience at your fingertips"
    }
  ];

  const individualBenefits = [
    "Get fair pricing from multiple shops instantly",
    "Book mobile repair at your location",
    "DIY option for budget-conscious drivers",
    "Real-time tracking and reminders",
    "Insurance claim assistance"
  ];

  const fleetBenefits = [
    "Centralized dashboard for all vehicles",
    "Volume discounts from our partner network",
    "Priority scheduling for business vehicles",
    "Detailed reporting and cost analytics",
    "Dedicated fleet support team"
  ];

  return (
    <section className="bg-gradient-to-b from-background to-muted/30 py-20">
      <div className="container mx-auto">
        
        {/* Main header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4 px-4 py-2">
            Why DriveX?
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            The smartest way to fix your glass
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            We're revolutionizing auto glass repair with AI-powered assessment, transparent pricing, 
            and a network of verified professionals. From single cars to entire fleets.
          </p>
        </div>

        {/* Our practices */}
        <div className="grid md:grid-cols-2 gap-8 mb-20">
          {practices.map((practice, index) => (
            <Card key={practice.title} className="hover-scale animate-fade-in border-0 shadow-lg" style={{ animationDelay: `${index * 150}ms` }}>
              <CardHeader>
                <CardTitle className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary flex-shrink-0">
                    <practice.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{practice.title}</h3>
                    <p className="text-muted-foreground font-normal">{practice.description}</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-primary font-medium">
                  <CheckCircle className="h-4 w-4" />
                  {practice.benefit}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* For individuals vs fleets */}
        <div className="grid lg:grid-cols-2 gap-12">
          
          {/* Individual drivers */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10">
            <CardHeader className="text-center pb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl mb-3">For Individual Drivers</CardTitle>
              <p className="text-muted-foreground">
                Fast, affordable, and hassle-free glass repair for your personal vehicle.
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
                  Average time to repair: 30 minutes
                </div>
                <p className="text-sm text-muted-foreground">Most repairs completed same-day</p>
              </div>
            </CardContent>
          </Card>

          {/* Fleet owners */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/20 dark:to-orange-900/10">
            <CardHeader className="text-center pb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-500/10 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-orange-600" />
              </div>
              <CardTitle className="text-2xl mb-3">For Fleet Owners</CardTitle>
              <p className="text-muted-foreground">
                Streamline maintenance across your entire fleet with enterprise-grade tools.
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
                  Average cost savings: 25-40%
                </div>
                <p className="text-sm text-muted-foreground">Compared to traditional repair channels</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <h3 className="text-2xl font-bold text-foreground mb-4">
            Ready to experience the future of auto glass repair?
          </h3>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers who've discovered a better way to fix their glass damage.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a 
              href="/report/eo3w_x1IBgPaUDj8gsUVkI2qL8rG0gSx" 
              className="px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
            >
              Start Your Assessment
            </a>
            <a 
              href="mailto:fleet@drivex.com" 
              className="px-8 py-4 border border-primary text-primary font-semibold rounded-lg hover:bg-primary/5 transition-colors"
            >
              Contact Fleet Sales
            </a>
          </div>
        </div>

      </div>
    </section>
  );
};

export default WhyChooseUs;