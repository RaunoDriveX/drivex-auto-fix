import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Brain, MapPin, CheckCircle, Wrench } from "lucide-react";

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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map(({ icon: Icon, title, desc }) => (
            <Card key={title}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-foreground" />
                  {title}
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
