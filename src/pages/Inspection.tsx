import { Helmet } from "react-helmet-async";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import QRCode from "react-qr-code";
import { Copy, MessageCircle, Smartphone, ExternalLink } from "lucide-react";

const Inspection = () => {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();

  // Generate the smartscan URL using the token
  const smartscanUrl = token ? `https://smartscan.drivex.io/?urlId=${token}&lang=en` : "";
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(smartscanUrl);
      toast({ title: "Link copied!", description: "The inspection link has been copied to your clipboard." });
    } catch (err) {
      toast({ title: "Copy failed", description: "Please copy the link manually.", variant: "destructive" });
    }
  };

  const sendViaSMS = () => {
    const message = `DriveX Vehicle Inspection: ${smartscanUrl}`;
    window.open(`sms:?body=${encodeURIComponent(message)}`, '_blank');
  };

  const sendViaWhatsApp = () => {
    const message = `DriveX Vehicle Inspection: ${smartscanUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const openInNewTab = () => {
    window.open(smartscanUrl, '_blank');
  };

  const title = token ? "Vehicle Self-Inspection" : "Invalid link";

  return (
    <>
      <Helmet>
        <title>{title} | DriveX</title>
        <meta name="description" content="Self-service vehicle inspection via smartphone. Scan QR code or use direct link." />
        <link rel="canonical" href={typeof window !== "undefined" ? window.location.href : "/inspection/mock"} />
      </Helmet>

      <main className="bg-background py-10">
        <div className="container mx-auto max-w-2xl">
          {!token ? (
            <Card>
              <CardHeader>
                <CardTitle>Invalid or expired link</CardTitle>
                <CardDescription>Please request a new inspection link.</CardDescription>
              </CardHeader>
              <CardFooter>
                <Button asChild>
                  <Link to="/">Back to home</Link>
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Header Card */}
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center gap-2">
                    <Smartphone className="h-6 w-6 text-primary" />
                    Self-Service Vehicle Inspection
                  </CardTitle>
                  <CardDescription>
                    Complete your windshield inspection using your smartphone. No technician visit required.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* QR Code Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-center">Scan with your phone</CardTitle>
                  <CardDescription className="text-center">
                    Use your smartphone camera to scan this QR code and start the inspection
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-4">
                  <div className="p-4 bg-white rounded-lg shadow-sm">
                    <QRCode
                      value={smartscanUrl}
                      size={200}
                      style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground text-center max-w-sm">
                    Point your phone's camera at the QR code above to automatically open the inspection interface
                  </p>
                </CardContent>
              </Card>

              {/* Alternative Methods Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Alternative sharing methods</CardTitle>
                  <CardDescription>
                    Can't scan the QR code? Use one of these options instead
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button variant="outline" onClick={sendViaSMS} className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Send via SMS
                    </Button>
                    <Button variant="outline" onClick={sendViaWhatsApp} className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Send via WhatsApp
                    </Button>
                    <Button variant="outline" onClick={copyToClipboard} className="flex items-center gap-2">
                      <Copy className="h-4 w-4" />
                      Copy Link
                    </Button>
                    <Button variant="outline" onClick={openInNewTab} className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Open Link
                    </Button>
                  </div>
                  
                  {/* Direct URL display */}
                  <div className="mt-4 p-3 bg-muted/30 rounded-md">
                    <Label className="text-xs text-muted-foreground">Direct link:</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs bg-background px-2 py-1 rounded border flex-1 truncate">
                        {smartscanUrl}
                      </code>
                      <Button size="sm" variant="ghost" onClick={copyToClipboard}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Instructions Card */}
              <Card>
                <CardHeader>
                  <CardTitle>What happens next?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-medium">
                      1
                    </div>
                    <div>
                      <p className="font-medium">Access the inspection tool</p>
                      <p className="text-sm text-muted-foreground">Scan the QR code or use one of the sharing options above</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-medium">
                      2
                    </div>
                    <div>
                      <p className="font-medium">Follow guided capture</p>
                      <p className="text-sm text-muted-foreground">Take photos of your windshield damage following the on-screen instructions</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-medium">
                      3
                    </div>
                    <div>
                      <p className="font-medium">Get instant AI assessment</p>
                      <p className="text-sm text-muted-foreground">Receive repair recommendations and partner pricing in minutes</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button asChild variant="secondary" className="w-full">
                    <Link to="/">Return to homepage</Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default Inspection;