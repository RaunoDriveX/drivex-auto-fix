import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Users, Building2, Zap, Shield, DollarSign, Clock, Smartphone, TrendingUp } from "lucide-react";

const WhyChooseUs = () => {
  const practices = [
    {
      icon: Zap,
      title: "AI-Powered Assessment",
      description: "Patent-pending technology analyzes damage instantly with 95% accuracy.",
      benefit: "Get the right solution every time"
    },
    {
      icon: DollarSign,
      title: "Transparent Marketplace",
      description: "Compare real prices from vetted shops. Fair deals for everyone.",
      benefit: "Best value with full price visibility"
    },
    {
      icon: Smartphone,
      title: "Mobile-First Platform",
      description: "Complete assessment to booking in minutes on your phone.",
      benefit: "Maximum convenience and speed"
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
        <div className="text-center mb-20">
          <Badge variant="secondary" className="mb-6 px-6 py-3 text-sm font-medium">
            Patent Pending Technology
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-8 leading-tight">
            Fair pricing. Quality repairs.<br/>
            <span className="text-primary">Powered by AI.</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            300,000 assessments completed with <span className="font-semibold text-foreground">95% accuracy</span> over 6 years. 
            DriveX creates transparency in the auto glass repair market.
          </p>
        </div>

        {/* Our practices */}
        <div className="grid md:grid-cols-3 gap-8 mb-24">
          {practices.map((practice, index) => (
            <div key={practice.title} className="text-center group animate-fade-in" style={{ animationDelay: `${index * 150}ms` }}>
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <practice.icon className="h-10 w-10 text-primary" />
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

        {/* Team section */}
        <div className="mt-20 mb-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="secondary" className="mb-4 px-4 py-2">
                Our Team
              </Badge>
              <h3 className="text-3xl font-bold text-foreground mb-6">
                Trusted by drivers worldwide
              </h3>
              <p className="text-lg text-muted-foreground mb-6">
                Our international team is already revolutionizing auto glass repair across multiple continents. 
                From our headquarters to our partner networks, we're building the future of automotive maintenance.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="font-medium">Europe</span>
                  <span className="text-muted-foreground">- Germany, Netherlands, and expanding</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="font-medium">North America</span>
                  <span className="text-muted-foreground">- United States operations</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="font-medium">Latin America</span>
                  <span className="text-muted-foreground">- Brazil market launch</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span className="font-medium">Africa</span>
                  <span className="text-muted-foreground">- Emerging market partnerships</span>
                </div>
              </div>

              <div className="mt-8 p-6 bg-primary/5 rounded-lg border border-primary/10">
                <div className="flex items-center gap-2 text-primary font-semibold mb-2">
                  <TrendingUp className="h-5 w-5" />
                  Proven Track Record
                </div>
                <p className="text-sm text-muted-foreground">
                  Over 300,000 assessments completed in 6 years of operation, 
                  with 97% customer satisfaction rate.
                </p>
              </div>
            </div>

            <div className="relative">
              <img
                src="/lovable-uploads/5cafe942-1574-4628-a9df-559fb4bd6d49.png"
                alt="DriveX international team members standing together with classic cars, representing our global presence"
                className="w-full h-auto rounded-xl shadow-2xl"
                loading="lazy"
              />
              <div className="absolute -bottom-4 -right-4 bg-white dark:bg-gray-900 p-4 rounded-lg shadow-lg border">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">4</div>
                  <div className="text-sm text-muted-foreground">Continents</div>
                </div>
              </div>
            </div>
          </div>
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