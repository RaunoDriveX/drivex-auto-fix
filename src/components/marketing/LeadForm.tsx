import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import CallCenterCTA from "@/components/CallCenterCTA";

const LeadForm = () => {
  const [loading, setLoading] = useState(false);
  const [isInsuranceClaim, setIsInsuranceClaim] = useState<string>("");

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      (toast as any).success?.("Booking confirmed! We'll contact you soon.") || toast("Booking confirmed! We'll contact you soon.");
      (e.currentTarget as HTMLFormElement).reset();
      window.location.hash = "lead-form";
    }, 600);
  };

  return (
    <section id="lead-form" aria-labelledby="lead-form-heading" className="bg-background py-16">
      <div className="container mx-auto max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Your booking details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" name="name" placeholder="Jane Doe" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="jane@example.com" required />
              </div>
              <div className="grid gap-2">
                <Label>Is this an insurance claim?</Label>
                <Select name="insuranceClaim" onValueChange={setIsInsuranceClaim}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes, insurance claim</SelectItem>
                    <SelectItem value="no">No, paying myself</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {isInsuranceClaim === "yes" && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="insurerName">Insurance company name</Label>
                    <Input id="insurerName" name="insurerName" placeholder="e.g. Allianz, AXA, etc." required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="policyNumber">Policy number</Label>
                    <Input id="policyNumber" name="policyNumber" placeholder="Your policy number" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="claimNumber">Claim number (if available)</Label>
                    <Input id="claimNumber" name="claimNumber" placeholder="Leave blank if not yet filed" />
                  </div>
                </>
              )}
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
                  {loading ? "Processing..." : "Finish my booking"}
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
