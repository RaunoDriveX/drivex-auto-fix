import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { ShoppingCart, Package, Truck, Shield, AlertTriangle, CheckCircle } from "lucide-react";

export type DIYResinKitProps = {
  chipSize: number; // in cm
  damageType: "chip" | "crack" | "spider";
};

const DIYResinKit = ({ chipSize, damageType }: DIYResinKitProps) => {
  const { toast } = useToast();
  const [showCheckout, setShowCheckout] = useState(false);
  const [showSafety, setShowSafety] = useState(false);
  const [orderStep, setOrderStep] = useState<"checkout" | "shipping" | "payment" | "confirmation">("checkout");
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "Netherlands",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    specialInstructions: ""
  });

  // Only show DIY option for chips under 2.5cm (1 inch)
  if (chipSize >= 2.5 || damageType !== "chip") {
    return null;
  }

  const kitPrice = 24.99;
  const shippingCost = 4.99;
  const totalCost = kitPrice + shippingCost;
  const estimatedDelivery = "1-2 business days";

  const safetyInstructions = [
    "Ensure vehicle is parked in a safe, well-lit area away from traffic",
    "Clean the damaged area thoroughly with glass cleaner before application",
    "Work in temperatures between 10°C and 25°C for optimal resin flow",
    "Wear safety glasses and gloves during application",
    "Keep resin away from skin and eyes - if contact occurs, rinse immediately",
    "Do not apply in direct sunlight or extreme weather conditions",
    "Allow 24 hours for full cure before washing the vehicle",
    "If damage appears larger than a euro coin after cleaning, stop and seek professional repair"
  ];

  const handleInputChange = (field: string, value: string) => {
    setOrderData(prev => ({ ...prev, [field]: value }));
  };

  const handleProceedToShipping = () => {
    if (!orderData.name || !orderData.email || !orderData.phone) {
      toast({ title: "Missing information", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    setOrderStep("shipping");
  };

  const handleProceedToPayment = () => {
    if (!orderData.address || !orderData.city || !orderData.postalCode) {
      toast({ title: "Missing shipping info", description: "Please fill in all shipping fields", variant: "destructive" });
      return;
    }
    setOrderStep("payment");
  };

  const handleMockPayment = async () => {
    if (!orderData.cardNumber || !orderData.expiryDate || !orderData.cvv) {
      toast({ title: "Missing payment info", description: "Please fill in all payment fields", variant: "destructive" });
      return;
    }
    
    setLoading(true);
    // Mock payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
    setOrderStep("confirmation");
    
    toast({ 
      title: "Order confirmed!", 
      description: `DIY Resin Kit ordered successfully. Order #RK${Date.now().toString().slice(-6)}`
    });
  };

  const renderCheckoutStep = () => {
    switch (orderStep) {
      case "checkout":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input 
                  id="name" 
                  value={orderData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone *</Label>
                <Input 
                  id="phone" 
                  value={orderData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="+31 6 12345678"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input 
                id="email" 
                type="email"
                value={orderData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="john@example.com"
              />
            </div>
          </div>
        );
      
      case "shipping":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="address">Street Address *</Label>
              <Input 
                id="address" 
                value={orderData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Hoofdstraat 123"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input 
                  id="city" 
                  value={orderData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  placeholder="Amsterdam"
                />
              </div>
              <div>
                <Label htmlFor="postalCode">Postal Code *</Label>
                <Input 
                  id="postalCode" 
                  value={orderData.postalCode}
                  onChange={(e) => handleInputChange("postalCode", e.target.value)}
                  placeholder="1234 AB"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input 
                id="country" 
                value={orderData.country}
                onChange={(e) => handleInputChange("country", e.target.value)}
                disabled
              />
            </div>
            <div>
              <Label htmlFor="instructions">Special delivery instructions (optional)</Label>
              <Textarea 
                id="instructions"
                value={orderData.specialInstructions}
                onChange={(e) => handleInputChange("specialInstructions", e.target.value)}
                placeholder="Leave at front door, ring bell, etc."
                rows={3}
              />
            </div>
          </div>
        );
      
      case "payment":
        return (
          <div className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-medium mb-2">Order Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>DIY Windshield Resin Kit</span>
                  <span>€{kitPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>€{shippingCost}</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>€{totalCost}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="cardNumber">Card Number *</Label>
                <Input 
                  id="cardNumber" 
                  value={orderData.cardNumber}
                  onChange={(e) => handleInputChange("cardNumber", e.target.value)}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiryDate">Expiry Date *</Label>
                  <Input 
                    id="expiryDate" 
                    value={orderData.expiryDate}
                    onChange={(e) => handleInputChange("expiryDate", e.target.value)}
                    placeholder="MM/YY"
                    maxLength={5}
                  />
                </div>
                <div>
                  <Label htmlFor="cvv">CVV *</Label>
                  <Input 
                    id="cvv" 
                    value={orderData.cvv}
                    onChange={(e) => handleInputChange("cvv", e.target.value)}
                    placeholder="123"
                    maxLength={4}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      
      case "confirmation":
        return (
          <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-success mx-auto" />
            <h3 className="text-xl font-semibold">Order Confirmed!</h3>
            <p className="text-muted-foreground">
              Your DIY Resin Kit has been ordered successfully.
            </p>
            <div className="p-4 bg-muted/30 rounded-lg text-left">
              <h4 className="font-medium mb-2">Order Details</h4>
              <div className="space-y-1 text-sm">
                <div>Order #: RK{Date.now().toString().slice(-6)}</div>
                <div>Delivery to: {orderData.address}, {orderData.city}</div>
                <div>Estimated delivery: {estimatedDelivery}</div>
                <div>Total paid: €{totalCost}</div>
              </div>
            </div>
          </div>
        );
    }
  };

  const getStepButtons = () => {
    switch (orderStep) {
      case "checkout":
        return (
          <Button onClick={handleProceedToShipping} className="w-full">
            Continue to Shipping
          </Button>
        );
      case "shipping":
        return (
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setOrderStep("checkout")} className="flex-1">
              Back
            </Button>
            <Button onClick={handleProceedToPayment} className="flex-1">
              Continue to Payment
            </Button>
          </div>
        );
      case "payment":
        return (
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setOrderStep("shipping")} className="flex-1">
              Back
            </Button>
            <Button onClick={handleMockPayment} disabled={loading} className="flex-1">
              {loading ? "Processing..." : `Pay €${totalCost}`}
            </Button>
          </div>
        );
      case "confirmation":
        return (
          <Button onClick={() => setShowCheckout(false)} className="w-full">
            Close
          </Button>
        );
    }
  };

  return (
    <Card className="bg-accent/5 border-accent/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-accent" />
          DIY Resin Kit
          <Badge variant="secondary">For small chips only</Badge>
        </CardTitle>
        <CardDescription>
          Perfect for chips under 2.5cm (1 inch). Quick fix to prevent further damage.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-background rounded-md border">
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8 text-accent" />
            <div>
              <div className="font-medium">Professional Resin Kit</div>
              <div className="text-sm text-muted-foreground">Includes resin, curing strips, instructions</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-semibold">€{kitPrice}</div>
            <div className="text-xs text-muted-foreground">+ €{shippingCost} shipping</div>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Truck className="h-4 w-4" />
            {estimatedDelivery}
          </div>
          <div className="flex items-center gap-1">
            <Shield className="h-4 w-4" />
            Money-back guarantee
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex gap-3">
        <Dialog open={showSafety} onOpenChange={setShowSafety}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex-1">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Safety Info
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Safety Instructions</DialogTitle>
              <DialogDescription>
                Please read these safety instructions carefully before using the DIY resin kit.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {safetyInstructions.map((instruction, index) => (
                <div key={index} className="flex gap-3 p-3 bg-muted/30 rounded-md">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-medium">
                    {index + 1}
                  </span>
                  <span className="text-sm">{instruction}</span>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button onClick={() => setShowSafety(false)}>
                I understand
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
          <DialogTrigger asChild>
            <Button className="flex-1">
              Order Kit - €{totalCost}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Order DIY Resin Kit</DialogTitle>
              <DialogDescription>
                {orderStep === "checkout" && "Enter your contact information"}
                {orderStep === "shipping" && "Where should we ship your kit?"}
                {orderStep === "payment" && "Complete your order"}
                {orderStep === "confirmation" && "Order confirmed!"}
              </DialogDescription>
            </DialogHeader>
            
            {renderCheckoutStep()}
            
            <DialogFooter>
              {getStepButtons()}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
};

export default DIYResinKit;