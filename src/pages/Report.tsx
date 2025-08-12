import { Helmet } from "react-helmet-async";
import { useMemo, useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import QRCode from "react-qr-code";

const CHANNELS = ["sms", "whatsapp", "qr", "link"] as const;
type Channel = typeof CHANNELS[number];

function generateToken(length = 24) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

const Report = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [vehicle, setVehicle] = useState(params.get("vehicle") || "");
  const [phone, setPhone] = useState(params.get("phone") || "");
  const [channel, setChannel] = useState<Channel>((params.get("channel") as Channel) || "sms");
  const [token, setToken] = useState<string>("");

  const inspectionUrl = useMemo(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return token ? `${origin}/inspection/${token}` : "";
  }, [token]);

  useEffect(() => {
    // Pre-generate a token so QR renders instantly when chosen
    setToken(generateToken());
  }, []);

  const onGenerate = () => {
    const newToken = generateToken();
    setToken(newToken);

    const url = `${window.location.origin}/inspection/${newToken}`;

    if (channel === "sms") {
      toast({ title: "Link sent via SMS (mock)", description: `To ${phone || "(no number)"}` });
    } else if (channel === "whatsapp") {
      toast({ title: "Link sent via WhatsApp (mock)", description: `To ${phone || "(no number)"}` });
    } else if (channel === "link") {
      navigator.clipboard.writeText(url).catch(() => {});
      toast({ title: "Link copied (mock)", description: url });
    }
  };

  return (
    <>
      <Helmet>
        <title>Start Smartphone Windshield Inspection | DriveX</title>
        <meta name="description" content="Generate a one-time smartphone inspection link to diagnose windshield damage with DriveX." />
        <link rel="canonical" href={typeof window !== "undefined" ? window.location.href : "/report"} />
        <meta property="og:title" content="Start Smartphone Windshield Inspection" />
        <meta property="og:description" content="Generate a one-time inspection link (mock)." />
      </Helmet>

      <main className="bg-background py-10">
        <div className="container mx-auto max-w-3xl">
          <article>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Start smartphone windshield inspection</h1>
            <p className="mt-2 text-muted-foreground">This is a mock experience. We’ll pretend to send a one-time link to your phone or show a QR you can scan.</p>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Send inspection link</CardTitle>
                <CardDescription>Choose how to deliver the link (mock only).</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-1">
                  <Label htmlFor="vehicle">Vehicle</Label>
                  <Input id="vehicle" value={vehicle} onChange={(e) => setVehicle(e.target.value)} placeholder="2019 Toyota Camry" />
                </div>

                <div className="grid gap-1">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 555-5555" />
                </div>

                <div className="grid gap-1">
                  <Label>Channel</Label>
                  <Select value={channel} onValueChange={(v) => setChannel(v as Channel)}>
                    <SelectTrigger aria-label="Delivery channel">
                      <SelectValue placeholder="Select channel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="qr">QR Code</SelectItem>
                      <SelectItem value="link">Copy Link</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4 items-start">
                <div className="flex gap-3">
                  <Button onClick={onGenerate}>Generate link</Button>
                  {token && (
                    <Button variant="secondary" onClick={() => navigate(`/inspection/${token}`)}>
                      Open as if on phone
                    </Button>
                  )}
                </div>

                {channel === "qr" && token && (
                  <div className="mt-2 grid gap-2">
                    <Label>Scan QR on your smartphone (mock)</Label>
                    <div className="bg-card p-4 rounded-md w-[220px] h-[220px] flex items-center justify-center">
                      <QRCode value={inspectionUrl} size={192} />
                    </div>
                    <p className="text-sm text-muted-foreground break-all">{inspectionUrl}</p>
                  </div>
                )}
              </CardFooter>
            </Card>
          </article>
        </div>
      </main>
    </>
  );
};

export default Report;
