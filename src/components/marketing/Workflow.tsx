import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Brain, MapPin, CheckCircle, Wrench, Bot } from "lucide-react";

const steps = [
  { icon: Camera, title: "Report damage", desc: "Upload photos or start a quick inspection." },
  { icon: Brain, title: "AI triage", desc: "We determine repair vs. replacement instantly." },
  { icon: MapPin, title: "Smart matching", desc: "We route you to top shops by price and quality." },
  { icon: CheckCircle, title: "Book & track", desc: "Pick a slot and track progress end-to-end." },
  { icon: Wrench, title: "DIY option", desc: "Uninsured? Order resin and fix it yourself." },
];

const Workflow = () => {
  return (
    <section aria-labelledby="workflow-heading" className="bg-background py-12">
      <div className="container mx-auto">
        <h2 id="workflow-heading" className="text-2xl md:text-3xl font-semibold text-foreground mb-6">
          How DriveX works
        </h2>

        <div className="mb-6 animate-enter rounded-lg border bg-card p-4 md:p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="h-6 w-6 text-primary" aria-hidden="true" />
          </div>
          <div>
            <p className="font-medium text-foreground">Meet your virtual technician</p>
            <p className="text-sm text-muted-foreground">Guides your photos, explains AI results, and helps pick a shop.</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map(({ icon: Icon, title, desc }, i) => (
            <Card
              key={title}
              className="hover-scale animate-fade-in"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    {i + 1}
                  </span>
                  <Icon className="h-5 w-5 text-foreground" aria-hidden="true" />
                  <span>{title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">{desc}</CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Workflow;
