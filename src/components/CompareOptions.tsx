import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Wrench, Truck, Store, ShoppingCart, Factory, Clock, MapPin, BadgeCheck } from "lucide-react";

export type CompareOptionsProps = {
  decision: "repair" | "replacement";
};

export default function CompareOptions({ decision }: CompareOptionsProps) {
  const isRepairRecommended = decision === "repair";

  return (
    <section aria-labelledby="compare-options-heading" className="mt-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 id="compare-options-heading" className="text-2xl font-semibold text-foreground">
          Compare options
        </h2>
        <Badge variant="secondary" className="hidden sm:inline-flex">
          <BadgeCheck className="h-3.5 w-3.5 mr-1" />
          Recommended: {isRepairRecommended ? "Repair" : "Replacement"}
        </Badge>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Repair card */}
        <Card className="hover-scale animate-fade-in" style={{ animationDelay: "40ms" }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" aria-hidden="true" />
              Repair options
              {isRepairRecommended && (
                <Badge className="ml-2">Recommended</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Choose a shop with real pricing and availability. Go mobile or visit a stationary shop.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="p-3 rounded-md border">
                <div className="flex items-center justify-between">
                  <div className="font-medium">RapidGlass Mobile</div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Mobile unit</Badge>
                    <span className="text-sm text-muted-foreground">from €89</span>
                  </div>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" /> Next slot: Today 16:30
                  <MapPin className="h-3.5 w-3.5" /> Comes to you
                </div>
              </div>
              <div className="p-3 rounded-md border">
                <div className="flex items-center justify-between">
                  <div className="font-medium">CityGlass Center</div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Stationary</Badge>
                    <span className="text-sm text-muted-foreground">from €79</span>
                  </div>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" /> Next slot: Tomorrow 09:00
                  <MapPin className="h-3.5 w-3.5" /> 2.1 km
                </div>
              </div>
            </div>
            <div className="p-3 rounded-md border bg-muted/30">
              <div className="flex items-center gap-2 font-medium">
                <ShoppingCart className="h-4 w-4" /> DIY resin kit (budget)
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Uninsured or tight budget? Order resin and follow our video to stop the spread.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/#lead-form">See shops</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/#lead-form">Order DIY resin</Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Replacement card */}
        <Card className="hover-scale animate-fade-in" style={{ animationDelay: "120ms" }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Factory className="h-5 w-5" aria-hidden="true" />
              Replacement options
            </CardTitle>
            <CardDescription>
              Order glass from DriveX catalog (mock) or compare shop offers (OEM vs aftermarket).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="p-3 rounded-md border">
                <div className="flex items-center justify-between">
                  <div className="font-medium">DriveX Glass Catalog</div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">OEM</Badge>
                    <Badge variant="secondary">Aftermarket</Badge>
                  </div>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <Truck className="h-3.5 w-3.5" /> Delivery ETA: 1–3 days
                  <Clock className="h-3.5 w-3.5" /> Install time: ~2h
                </div>
              </div>
              <div className="p-3 rounded-md border">
                <div className="flex items-center justify-between">
                  <div className="font-medium">Partner Shop Offers</div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">OEM</Badge>
                    <Badge variant="secondary">Aftermarket</Badge>
                  </div>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <Store className="h-3.5 w-3.5" /> Nearby shops with next-day availability
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/#lead-form">Browse catalog</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/#lead-form">See shop offers</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </section>
  );
}
