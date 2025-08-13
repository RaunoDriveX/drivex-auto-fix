import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Wrench, Truck, Store, ShoppingCart, Factory, Clock, MapPin, BadgeCheck, Leaf, Banknote, ShieldCheck } from "lucide-react";

export type CompareOptionsProps = {
  decision: "repair" | "replacement";
  postalCode?: string;
  showReplacement?: boolean;
  onRequestReplacement?: () => void;
};

export default function CompareOptions({ decision, postalCode, showReplacement = true, onRequestReplacement }: CompareOptionsProps) {
  const isRepairRecommended = decision === "repair";

  type Shop = {
    id: string;
    name: string;
    type: "Mobile" | "Stationary";
    distanceKm?: number; // for stationary
    labor: number;
    materials: number;
    tax: number;
    nextSlot: string; // ISO or label
    rating: number; // 0-5
    reviews: number;
    color: string; // tailwind bg token suffix, e.g., 'primary/10'
  };

  const euro = (n: number) => `€${n.toFixed(0)}`;
  const total = (s: Shop) => s.labor + s.materials + s.tax;

  const repairShops: Shop[] = [
    { id: "rgm", name: "RapidGlass Mobile", type: "Mobile", labor: 55, materials: 24, tax: 10, nextSlot: "Today 16:30", rating: 4.6, reviews: 128, color: "primary/10" },
    { id: "cgc", name: "CityGlass Center", type: "Stationary", distanceKm: 2.1, labor: 49, materials: 20, tax: 10, nextSlot: "Tomorrow 09:00", rating: 4.8, reviews: 201, color: "accent/10" },
    { id: "glx", name: "GlassXperts", type: "Stationary", distanceKm: 3.4, labor: 45, materials: 22, tax: 10, nextSlot: "Today 18:00", rating: 4.4, reviews: 76, color: "secondary/15" },
  ];

  const replacementShops: Shop[] = [
    { id: "dxc", name: "DriveX OEM Center", type: "Stationary", distanceKm: 4.8, labor: 120, materials: 220, tax: 68, nextSlot: "In 2 days", rating: 4.7, reviews: 93, color: "primary/10" },
    { id: "ps1", name: "Partner Shop A", type: "Stationary", distanceKm: 2.9, labor: 110, materials: 180, tax: 58, nextSlot: "Tomorrow 13:00", rating: 4.5, reviews: 141, color: "accent/10" },
    { id: "ps2", name: "Partner Shop B", type: "Mobile", labor: 115, materials: 175, tax: 57, nextSlot: "Tomorrow 08:30", rating: 4.3, reviews: 67, color: "secondary/15" },
  ];

  const byBestPrice = (shops: Shop[]) => shops.reduce((a, b) => (total(a) <= total(b) ? a : b));
  const bySoonest = (shops: Shop[]) => {
    // very simple scoring: Today < Tomorrow < In N days
    const score = (slot: string) => (slot.startsWith("Today") ? 0 : slot.startsWith("Tomorrow") ? 1 : 2);
    return shops.reduce((a, b) => (score(a.nextSlot) <= score(b.nextSlot) ? a : b));
  };
  const byTopRated = (shops: Shop[]) => shops.reduce((a, b) => (a.rating >= b.rating ? a : b));

  const repairBestPrice = byBestPrice(repairShops).id;
  const repairSoonest = bySoonest(repairShops).id;
  const repairTopRated = byTopRated(repairShops).id;

  const replBestPrice = byBestPrice(replacementShops).id;
  const replSoonest = bySoonest(replacementShops).id;
  const replTopRated = byTopRated(replacementShops).id;

  return (
    <section aria-labelledby="compare-options-heading" className="mt-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 id="compare-options-heading" className="text-2xl font-semibold text-foreground">
          Partner offers near {postalCode ? postalCode : "your area"}
        </h2>
        <Badge variant="success" className="hidden sm:inline-flex items-center gap-1">
          <Leaf className="h-3.5 w-3.5" />
          <Banknote className="h-3.5 w-3.5" />
          Repair recommended
        </Badge>
      </div>

      <div className={`grid gap-6 ${showReplacement ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
        {/* Repair card */}
        <Card className="relative overflow-hidden hover-scale animate-fade-in border-success/40 bg-success/5 hover:ring-2 hover:ring-success/30 transition-shadow" style={{ animationDelay: "40ms" }}>
          <div aria-hidden className="absolute left-0 top-0 h-full w-1 bg-success" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-success" aria-hidden="true" />
              Repair options
              {isRepairRecommended && (
                <Badge variant="success" className="ml-2 inline-flex items-center gap-1">
                  <Leaf className="h-3.5 w-3.5" />
                  <Banknote className="h-3.5 w-3.5" />
                  Eco + saves money
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Choose a shop with real pricing and availability. Go mobile or visit a stationary shop.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              {repairShops.map((s) => (
                <div key={s.id} className="p-3 rounded-md border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-md grid place-items-center text-xs font-semibold ${s.id === 'rgm' ? 'bg-primary/10' : s.id === 'cgc' ? 'bg-accent/10' : 'bg-secondary/20'}`} aria-label={`${s.name} logo`}>
                        {s.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="font-medium">{s.name}</div>
                        <Badge variant="secondary">{s.type}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {s.id === repairBestPrice && <Badge>Best price</Badge>}
                      {s.id === repairSoonest && <Badge variant="secondary">Soonest</Badge>}
                      {s.id === repairTopRated && <Badge variant="secondary">Top-rated</Badge>}
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Next slot: {s.nextSlot}</div>
                    <div className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {s.type === 'Mobile' ? 'Comes to you' : `${s.distanceKm?.toFixed(1)} km`}</div>
                    {s.type === 'Mobile' ? (
                      <div className="flex items-center gap-1"><Truck className="h-3.5 w-3.5" /> Mobile service at your location</div>
                    ) : (
                      <div className="flex items-center gap-1"><Store className="h-3.5 w-3.5" /> Stationary workshop</div>
                    )}
                    <div>Rating: <span className="text-foreground font-medium">{s.rating.toFixed(1)}</span> ({s.reviews})</div>
                  </div>
                  <div className="mt-3 flex items-center justify-end">
                    <div className="text-sm"><span className="text-muted-foreground mr-1">Total</span><span className="font-semibold text-foreground">{euro(total(s))}</span></div>
                  </div>
                  <div className="mt-3">
                    <Button asChild size="sm"><Link to="/#lead-form">Select</Link></Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 rounded-md border bg-muted/30">
              <div className="flex items-center gap-2 font-medium">
                <ShoppingCart className="h-4 w-4" /> Repair Yourself with resin and tutorials
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Uninsured or tight budget? Order resin and follow our video to stop the spread.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Pricing includes labor, materials, and tax.</span>
            {!showReplacement && onRequestReplacement && (
              <Button variant="link" size="sm" onClick={onRequestReplacement}>Prefer full replacement? See options</Button>
            )}
          </CardFooter>
        </Card>

        {/* Replacement card */}
        {showReplacement && (
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
                {replacementShops.map((s) => (
                  <div key={s.id} className="p-3 rounded-md border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-9 w-9 rounded-md grid place-items-center text-xs font-semibold ${s.id === 'dxc' ? 'bg-primary/10' : s.id === 'ps1' ? 'bg-accent/10' : 'bg-secondary/20'}`} aria-label={`${s.name} logo`}>
                          {s.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                        </div>
                        <div className="font-medium">{s.name}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {s.id === replBestPrice && <Badge>Best price</Badge>}
                        {s.id === replSoonest && <Badge variant="secondary">Soonest</Badge>}
                        {s.id === replTopRated && <Badge variant="secondary">Top-rated</Badge>}
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Next slot: {s.nextSlot}</div>
                      <div className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {s.type === 'Mobile' ? 'Comes to you' : `${s.distanceKm?.toFixed(1)} km`}</div>
                      <div>Rating: <span className="text-foreground font-medium">{s.rating.toFixed(1)}</span> ({s.reviews})</div>
                    </div>
                    <div className="mt-3 flex items-center justify-end">
                      <div className="text-sm"><span className="text-muted-foreground mr-1">Total</span><span className="font-semibold text-foreground">{euro(total(s))}</span></div>
                    </div>
                    <div className="mt-3">
                      <Button asChild size="sm"><Link to="/#lead-form">Select</Link></Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="hidden" />
          </Card>
        )}
      </div>
    </section>
  );
}
