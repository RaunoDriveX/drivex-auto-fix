import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const LeadForm = () => {
  const [loading, setLoading] = useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      (toast as any).success?.("Request received! We'll reach out shortly.") || toast("Request received! We'll reach out shortly.");
      (e.currentTarget as HTMLFormElement).reset();
      window.location.hash = "lead-form";
    }, 600);
  };

  return (
    <section id="lead-form" aria-labelledby="lead-form-heading" className="bg-background py-16">
      <div className="container mx-auto max-w-3xl">
        <h2 id="lead-form-heading" className="text-2xl md:text-3xl font-semibold text-foreground mb-6">
          Get your glass fixed fast
        </h2>
        <Card>
          <CardHeader>
            <CardTitle>Tell us about the damage</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" name="name" placeholder="Jane Doe" required />
              </div>
              <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="jane@example.com" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" type="tel" placeholder="(555) 555-5555" />
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="vehicle">Vehicle</Label>
                  <Input id="vehicle" name="vehicle" placeholder="2019 Toyota Camry" />
                </div>
                <div className="grid gap-2">
                  <Label>Insurance</Label>
                  <Select name="insured">
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="insured">Insured</SelectItem>
                      <SelectItem value="uninsured">Uninsured</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="desc">Damage details</Label>
                <Textarea id="desc" name="desc" placeholder="Briefly describe the chip, crack, or breakage." rows={4} />
              </div>
              <div className="grid gap-2">
                <Label>Preferred contact</Label>
                <Select name="contact">
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="call">Call</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="pt-2">
                <Button type="submit" disabled={loading}>
                  {loading ? "Submitting..." : "Submit Request"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default LeadForm;
