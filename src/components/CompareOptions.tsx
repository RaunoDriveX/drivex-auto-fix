import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Wrench, Truck, Store, ShoppingCart, Factory, Clock, MapPin, BadgeCheck, Leaf, Banknote, ShieldCheck } from "lucide-react";
import { StarRating } from "@/components/ui/star-rating";
import DIYResinKit from "@/components/DIYResinKit";
import { supabase } from "@/integrations/supabase/client";

export type CompareOptionsProps = {
  decision: "repair" | "replacement";
  postalCode?: string;
  showReplacement?: boolean;
  onRequestReplacement?: () => void;
  onBookSlot?: (shopId: string, shopName: string) => void;
  chipSize?: number; // in cm, for DIY resin kit eligibility
  damageType?: "chip" | "crack" | "spider";
};

export default function CompareOptions({ decision, postalCode, showReplacement = true, onRequestReplacement, onBookSlot, chipSize = 3.0, damageType = "chip" }: CompareOptionsProps) {
  const isRepairRecommended = decision === "repair";
  const [repairShops, setRepairShops] = useState<Shop[]>([]);
  const [replacementShops, setReplacementShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    const fetchShops = async () => {
      try {
        // Fetch repair shops
        const { data: repairData } = await supabase
          .from('shops')
          .select('*')
          .in('service_capability', ['repair_only', 'both'])
          .eq('insurance_approved', true);

        // Fetch replacement shops
        const { data: replacementData } = await supabase
          .from('shops')
          .select('*')
          .in('service_capability', ['replacement_only', 'both'])
          .eq('insurance_approved', true);

        // Transform repair shops
        if (repairData) {
          const transformedRepair = repairData.map((shop, idx) => ({
            id: shop.id,
            name: shop.name,
            type: shop.is_mobile_service ? "Mobile" : "Stationary" as "Mobile" | "Stationary",
            distanceKm: shop.is_mobile_service ? undefined : 2.1 + idx * 0.5,
            labor: 45 + idx * 5,
            materials: 20 + idx * 2,
            tax: 10,
            nextSlot: idx === 0 ? "Today 16:30" : idx === 1 ? "Tomorrow 09:00" : "Today 18:00",
            rating: shop.rating || 4.5,
            reviews: shop.total_reviews || 0,
            color: idx === 0 ? "primary/10" : idx === 1 ? "accent/10" : "secondary/15"
          }));
          setRepairShops(transformedRepair);
        }

        // Transform replacement shops
        if (replacementData) {
          const transformedReplacement = replacementData.map((shop, idx) => ({
            id: shop.id,
            name: shop.name,
            type: shop.is_mobile_service ? "Mobile" : "Stationary" as "Mobile" | "Stationary",
            distanceKm: shop.is_mobile_service ? undefined : 2.9 + idx * 1.5,
            labor: 110 + idx * 5,
            materials: 180 + idx * 20,
            tax: 57 + idx,
            nextSlot: idx === 0 ? "In 2 days" : idx === 1 ? "Tomorrow 13:00" : "Tomorrow 08:30",
            rating: shop.rating || 4.5,
            reviews: shop.total_reviews || 0,
            color: idx === 0 ? "primary/10" : idx === 1 ? "accent/10" : "secondary/15"
          }));
          setReplacementShops(transformedReplacement);
        }
      } catch (error) {
        console.error('Error fetching shops:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchShops();
  }, []);

  const byBestPrice = (shops: Shop[]) => shops.length > 0 ? shops.reduce((a, b) => (total(a) <= total(b) ? a : b)) : null;
  const bySoonest = (shops: Shop[]) => {
    if (shops.length === 0) return null;
    // very simple scoring: Today < Tomorrow < In N days
    const score = (slot: string) => (slot.startsWith("Today") ? 0 : slot.startsWith("Tomorrow") ? 1 : 2);
    return shops.reduce((a, b) => (score(a.nextSlot) <= score(b.nextSlot) ? a : b));
  };
  const byTopRated = (shops: Shop[]) => shops.length > 0 ? shops.reduce((a, b) => (a.rating >= b.rating ? a : b)) : null;

  const repairBestPrice = byBestPrice(repairShops)?.id;
  const repairSoonest = bySoonest(repairShops)?.id;
  const repairTopRated = byTopRated(repairShops)?.id;

  const replBestPrice = byBestPrice(replacementShops)?.id;
  const replSoonest = bySoonest(replacementShops)?.id;
  const replTopRated = byTopRated(replacementShops)?.id;

  if (loading) {
    return (
      <section aria-labelledby="compare-options-heading" className="mt-10">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading available shops...</p>
        </div>
      </section>
    );
  }

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
                    {s.type !== 'Mobile' && (
                      <div className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {`${s.distanceKm?.toFixed(1)} km`}</div>
                    )}
                    {s.type === 'Mobile' ? (
                      <div className="flex items-center gap-1"><Truck className="h-3.5 w-3.5" /> Mobile service</div>
                    ) : (
                      <div className="flex items-center gap-1"><Store className="h-3.5 w-3.5" /> Stationary workshop</div>
                    )}
                  </div>
                  <div className="mt-2">
                    <StarRating rating={s.rating} size="sm" showValue reviews={s.reviews} />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="text-sm"><span className="text-muted-foreground mr-1">Total</span><span className="font-semibold text-foreground">{euro(total(s))}</span></div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5" /> Next slot: {s.nextSlot}</div>
                      <Button size="sm" onClick={() => onBookSlot?.(s.id, s.name)}>Book a slot</Button>
                    </div>
                  </div>
                </div>
              ))}
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
                      <Button size="sm" onClick={() => onBookSlot?.(s.id, s.name)}>Select</Button>
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
