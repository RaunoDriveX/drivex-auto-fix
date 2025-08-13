import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, Camera, Brain, Target, Calendar, Wrench, Phone, MapPin, Clock, Star } from "lucide-react";

const steps = [
  { 
    icon: Smartphone, 
    title: "Vehicle info & contact", 
    desc: "Quick vehicle details and your phone number to get started.",
    color: "bg-blue-500/10 text-blue-600"
  },
  { 
    icon: Camera, 
    title: "Easy self-inspection", 
    desc: "Follow guided photo steps - we'll help you capture the right angles.",
    color: "bg-green-500/10 text-green-600"
  },
  { 
    icon: Brain, 
    title: "AI triage", 
    desc: "Our AI instantly analyzes damage and decides: repair or replace?",
    color: "bg-purple-500/10 text-purple-600"
  },
  { 
    icon: Target, 
    title: "Smart matching & prices", 
    desc: "See transparent pricing from mobile and stationary repair shops near you.",
    color: "bg-orange-500/10 text-orange-600"
  },
  { 
    icon: Calendar, 
    title: "Book & track", 
    desc: "Choose your slot, get reminders, and track progress in real-time.",
    color: "bg-indigo-500/10 text-indigo-600"
  },
  { 
    icon: Wrench, 
    title: "DIY repair option", 
    desc: "Uninsured or budget-conscious? Order professional resin and fix yourself.",
    color: "bg-red-500/10 text-red-600"
  },
];

const Workflow = () => {
  return (
    <section aria-labelledby="workflow-heading" className="bg-gradient-to-br from-background to-muted/20 py-16">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 id="workflow-heading" className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            How DriveX works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From damage report to repair completion in 6 simple steps. Fast, transparent, and designed for your convenience.
          </p>
        </div>

        {/* Virtual technician callout */}
        <div className="mb-12 animate-fade-in rounded-xl border bg-gradient-to-r from-primary/5 to-accent/5 p-6 md:p-8 flex items-center gap-6 max-w-4xl mx-auto">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Phone className="h-8 w-8 text-primary" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Meet your virtual technician</h3>
            <p className="text-muted-foreground">
              Our AI assistant guides your photos, explains results in simple terms, and helps you choose the perfect repair shop for your needs.
            </p>
          </div>
        </div>

        {/* Process steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {steps.map(({ icon: Icon, title, desc, color }, i) => (
            <Card
              key={title}
              className="relative hover-scale animate-fade-in border-0 shadow-lg bg-white/50 backdrop-blur-sm overflow-hidden group hover:shadow-xl transition-all duration-300"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {/* Step number indicator */}
              <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-bold text-primary">{i + 1}</span>
              </div>
              
              {/* Decorative gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <CardHeader className="relative">
                <CardTitle className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${color} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <span className="text-lg font-semibold">{title}</span>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="relative">
                <p className="text-muted-foreground leading-relaxed">{desc}</p>
                
                {/* Additional detail icons */}
                <div className="flex gap-2 mt-4 opacity-60">
                  {i === 1 && <Camera className="h-4 w-4" />}
                  {i === 3 && (
                    <>
                      <MapPin className="h-4 w-4" />
                      <Star className="h-4 w-4" />
                    </>
                  )}
                  {i === 4 && <Clock className="h-4 w-4" />}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Workflow;
