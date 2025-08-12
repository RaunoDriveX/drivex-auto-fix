import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { BadgeCheck, Clock, MapPin, Truck, Store, Wrench, Factory } from "lucide-react";

export type ShopOffersProps = {
  kind: "repair" | "replacement";
};

export default function ShopOffers({ kind }: ShopOffersProps) {
  const isRepair = kind === "repair";
  const title = isRepair ? "Compare repair shop offers" : "Compare replacement shop offers";
  const subtitle = isRepair
    ? "Real-world pricing and availability from mobile and stationary shops."
    : "OEM and aftermarket options with delivery and install estimates.";

  return (
    <section aria-labelledby="shop-offers-heading" className="animate-fade-in">
      <div className="mb-3 flex items-center gap-2">
        <h2 id="shop-offers-heading" className="text-xl md:text-2xl font-semibold text-foreground">
          {title}
        </h2>
        <Badge variant="secondary" className="hidden sm:inline-flex">
          <BadgeCheck className="h-3.5 w-3.5 mr-1" /> Mock data
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground mb-4">{subtitle}</p>

      {isRepair ? (
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="hover-scale">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2"><Wrench className="h-5 w-5" /> RapidGlass Mobile</span>
                <Badge variant="secondary">Mobile</Badge>
              </CardTitle>
              <CardDescription>Comes to you. Great for chips and small cracks.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Your location</div>
              <div className="flex items-center gap-2"><Clock className="h-4 w-4" /> Next slot: Today 16:30</div>
              <div className="flex items-center gap-2"><Truck className="h-4 w-4" /> Callout fee included</div>
              <div className="text-foreground">From €89</div>
            </CardContent>
            <CardFooter>
              <Button asChild><Link to="/#lead-form">Select this shop</Link></Button>
            </CardFooter>
          </Card>

          <Card className="hover-scale">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2"><Store className="h-5 w-5" /> CityGlass Center</span>
                <Badge variant="secondary">Stationary</Badge>
              </CardTitle>
              <CardDescription>Drive-in service with waiting area and Wi‑Fi.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> 2.1 km</div>
              <div className="flex items-center gap-2"><Clock className="h-4 w-4" /> Next slot: Tomorrow 09:00</div>
              <div className="text-foreground">From €79</div>
            </CardContent>
            <CardFooter className="flex gap-3">
              <Button asChild><Link to="/#lead-form">Select this shop</Link></Button>
              <Button asChild variant="secondary"><Link to="/#lead-form">Compare more</Link></Button>
            </CardFooter>
          </Card>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="hover-scale">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Factory className="h-5 w-5" /> DriveX Glass Catalog</CardTitle>
              <CardDescription>Order OEM or aftermarket glass from our catalog (mock).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><Truck className="h-4 w-4" /> Delivery ETA: 1–3 days</div>
              <div className="flex items-center gap-2"><Clock className="h-4 w-4" /> Install time: ~2h</div>
            </CardContent>
            <CardFooter className="flex gap-3">
              <Button asChild><Link to="/#lead-form">Browse catalog</Link></Button>
              <Button asChild variant="secondary"><Link to="/#lead-form">Get assistance</Link></Button>
            </CardFooter>
          </Card>

          <Card className="hover-scale">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Store className="h-5 w-5" /> Partner Shop Offers</CardTitle>
              <CardDescription>Compare quotes from nearby shops (OEM vs aftermarket).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Multiple locations</div>
              <div className="flex items-center gap-2"><Clock className="h-4 w-4" /> Next‑day availability</div>
            </CardContent>
            <CardFooter className="flex gap-3">
              <Button asChild><Link to="/#lead-form">See offers</Link></Button>
              <Button asChild variant="secondary"><Link to="/#lead-form">Request callback</Link></Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </section>
  );
}
