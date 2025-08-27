import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Users, Building2, Zap, Shield, DollarSign, Clock, Smartphone, TrendingUp } from "lucide-react";

const WhyChooseUs = () => {
  const carOwnerBenefits = [
    {
      icon: DollarSign,
      title: "Transparent Pricing",
      description: "Compare OEM glass vs. lower-cost options, always with calibration included.",
      benefit: "Fair pricing, no surprises"
    },
    {
      icon: Shield,
      title: "No Insurance Required",
      description: "Most drivers pay out-of-pocket, and we make it simple and fair.",
      benefit: "Built for Mexico's reality"
    },
    {
      icon: Smartphone,
      title: "Total Convenience",
      description: "Book online in minutes, with mobile or in-shop service options.",
      benefit: "Your schedule, your location"
    },
    {
      icon: CheckCircle,
      title: "Safety Guaranteed",
      description: "Repair + ADAS recalibration in one visit, with certificate provided.",
      benefit: "Complete peace of mind"
    },
    {
      icon: Badge,
      title: "Trusted Network",
      description: "Every shop in our network is vetted and backed by the Autocristal brand.",
      benefit: "Quality you can count on"
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
    <section id="about" className="bg-gradient-to-b from-background to-muted/30 py-20">
      <div className="container mx-auto">
        
        {/* Main header */}
        <div className="text-center mb-20">
          <Badge variant="secondary" className="mb-6 px-6 py-3 text-sm font-medium">
            🚘 For Car Owners
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-8 leading-tight">
            Fix your windshield today<br/>
            <span className="text-primary">and avoid fines.</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            <span className="font-semibold text-foreground">70% of drivers in Mexico don't have insurance</span> — our platform is built for them. 
            With stricter inspections & fines, timely windshield repair is now a necessity.
          </p>
        </div>

        {/* Car owner benefits */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {carOwnerBenefits.map((benefit, index) => (
            <div key={benefit.title} className="text-center group animate-fade-in" style={{ animationDelay: `${index * 150}ms` }}>
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <benefit.icon className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">{benefit.title}</h3>
              <p className="text-muted-foreground mb-4 leading-relaxed">{benefit.description}</p>
              <div className="inline-flex items-center gap-2 text-sm text-primary font-medium px-4 py-2 bg-primary/5 rounded-full">
                <CheckCircle className="h-4 w-4" />
                {benefit.benefit}
              </div>
            </div>
          ))}
        </div>

        {/* Shop benefits - brief mention */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4 px-4 py-2">
              🔧 For Repair Shops
            </Badge>
            <h3 className="text-3xl font-bold text-foreground mb-6">
              Win more jobs — risk free
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Losing customers to big chains and dealerships? Join Autocristal and get ready-to-go customers sent straight to your shop.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-muted/50 rounded-lg">
              <Users className="h-8 w-8 text-primary mx-auto mb-3" />
              <h4 className="font-semibold mb-2">Ready Customers</h4>
              <p className="text-sm text-muted-foreground">Confirmed jobs sent directly to you</p>
            </div>
            <div className="text-center p-6 bg-muted/50 rounded-lg">
              <DollarSign className="h-8 w-8 text-primary mx-auto mb-3" />
              <h4 className="font-semibold mb-2">No Subscriptions</h4>
              <p className="text-sm text-muted-foreground">Only pay when you get real work</p>
            </div>
            <div className="text-center p-6 bg-muted/50 rounded-lg">
              <Smartphone className="h-8 w-8 text-primary mx-auto mb-3" />
              <h4 className="font-semibold mb-2">Digital Presence</h4>
              <p className="text-sm text-muted-foreground">Online booking and reviews included</p>
            </div>
            <div className="text-center p-6 bg-muted/50 rounded-lg">
              <Shield className="h-8 w-8 text-primary mx-auto mb-3" />
              <h4 className="font-semibold mb-2">Quality Seal</h4>
              <p className="text-sm text-muted-foreground">Stand tall against chains</p>
            </div>
          </div>
        </div>

        {/* Why Autocristal section */}
        <div className="text-center mb-20">
          <Badge variant="secondary" className="mb-6 px-6 py-3 text-sm font-medium">
            🌟 Why Autocristal?
          </Badge>
          <h3 className="text-3xl font-bold text-foreground mb-8">
            The trusted network connecting car owners and repair shops across Latin America
          </h3>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg">
              <div className="text-2xl font-bold text-primary mb-2">70%</div>
              <p className="text-sm text-muted-foreground">of drivers in Mexico don't have insurance — our platform is built for them</p>
            </div>
            <div className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg">
              <CheckCircle className="h-8 w-8 text-primary mx-auto mb-3" />
              <h4 className="font-semibold mb-2">Certification & Warranty</h4>
              <p className="text-sm text-muted-foreground">Every job comes with proof of quality</p>
            </div>
            <div className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg">
              <TrendingUp className="h-8 w-8 text-primary mx-auto mb-3" />
              <h4 className="font-semibold mb-2">Growing Network</h4>
              <p className="text-sm text-muted-foreground">More shops = more trust = more customers for everyone</p>
            </div>
          </div>
          
          <p className="text-lg text-muted-foreground mt-8 max-w-2xl mx-auto">
            💡 <strong>Autocristal:</strong> not just a directory, but the trusted network connecting car owners and repair shops across Latin America.
          </p>
        </div>

      </div>
    </section>
  );
};

// Separate component for customer segments
export const CustomerSegments = () => {
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

      </div>
    </section>
  );
};

export default WhyChooseUs;