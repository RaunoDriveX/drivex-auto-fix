import { Helmet } from "react-helmet-async";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import QRCode from "react-qr-code";
import { Copy, MessageCircle, Smartphone, ExternalLink, Camera } from "lucide-react";
import { useState, useEffect } from "react";

const Inspection = () => {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const [isMobile, setIsMobile] = useState(false);

  // Detect if user is on mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const mobileKeywords = ['android', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone'];
      const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword));
      const isMobileScreen = window.innerWidth <= 768;
      setIsMobile(isMobileUA || isMobileScreen);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  const startInspection = () => {
    // Add callback parameter to redirect to results page after completion
    const callbackUrl = `${window.location.origin}/results/${token}`;
    const urlWithCallback = `${smartscanUrl}&callback=${encodeURIComponent(callbackUrl)}`;
    window.location.href = urlWithCallback;
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
              {isMobile ? (
                /* Mobile View - Direct Action Button */
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center gap-2">
                      <Camera className="h-6 w-6 text-primary" />
                      Ready to Inspect Your Vehicle
                    </CardTitle>
                    <CardDescription>
                      You're on your smartphone - perfect! Start photographing your windshield damage now.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center space-y-4">
                    <div className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl border">
                      <Camera className="h-16 w-16 mx-auto text-primary mb-4" />
                      <p className="text-muted-foreground mb-4">
                        Tap the button below to start the guided photo capture process
                      </p>
                      <Button 
                        onClick={startInspection}
                        size="lg"
                        className="w-full h-14 text-lg font-semibold"
                      >
                        📸 Go Photograph Your Car Right Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                /* Desktop View - QR Code */
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center gap-2">
                      <Smartphone className="h-6 w-6 text-primary" />
                      Vehicle Self-Inspection
                    </CardTitle>
                    <CardDescription>
                      Scan the QR code below with your smartphone to start the inspection
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center space-y-4">
                    <div className="p-6 bg-white rounded-xl shadow-md border">
                      <QRCode
                        value={smartscanUrl}
                        size={240}
                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground text-center max-w-md">
                      Point your phone's camera at the QR code to automatically open the inspection interface
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Alternative sharing methods - Show for desktop or as backup for mobile */}
              {!isMobile && (
                <Card>
                  <CardHeader>
                    <CardTitle>Can't scan the QR code?</CardTitle>
                    <CardDescription>
                      Send the inspection link directly to your phone
                    </CardDescription>
                  </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button 
                      onClick={sendViaSMS} 
                      className="flex items-center gap-2 h-12"
                      variant="outline"
                    >
                      <MessageCircle className="h-5 w-5" />
                      Send via SMS
                    </Button>
                    <Button 
                      onClick={sendViaWhatsApp} 
                      className="flex items-center gap-2 h-12"
                      variant="outline"
                    >
                      <MessageCircle className="h-5 w-5" />
                      Send via WhatsApp
                    </Button>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button 
                      onClick={copyToClipboard} 
                      variant="ghost" 
                      className="flex items-center gap-2 flex-1"
                    >
                      <Copy className="h-4 w-4" />
                      Copy Link
                    </Button>
                    <Button 
                      onClick={openInNewTab} 
                      variant="ghost" 
                      className="flex items-center gap-2 flex-1"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open in Browser
                    </Button>
                  </div>
                  
                  {/* Direct URL display */}
                  <div className="mt-4 p-3 bg-muted/30 rounded-md">
                    <Label className="text-xs text-muted-foreground">Inspection Link:</Label>
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
              )}

              {/* Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle>How it works</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isMobile ? (
                    /* Mobile Instructions */
                    <>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-medium">
                          1
                        </div>
                        <div>
                          <p className="font-medium">Start the camera</p>
                          <p className="text-sm text-muted-foreground">Tap the button above to launch the inspection tool</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-medium">
                          2
                        </div>
                        <div>
                          <p className="font-medium">Follow the guide</p>
                          <p className="text-sm text-muted-foreground">Take photos of your windshield damage following the on-screen instructions</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-medium">
                          3
                        </div>
                        <div>
                          <p className="font-medium">Get instant results</p>
                          <p className="text-sm text-muted-foreground">AI assessment with repair recommendations and pricing</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Desktop Instructions */
                    <>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-medium">
                          1
                        </div>
                        <div>
                          <p className="font-medium">Access on your phone</p>
                          <p className="text-sm text-muted-foreground">Scan QR code or use SMS/WhatsApp to get the link</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-medium">
                          2
                        </div>
                        <div>
                          <p className="font-medium">Take guided photos</p>
                          <p className="text-sm text-muted-foreground">Follow instructions to capture your windshield damage</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-medium">
                          3
                        </div>
                        <div>
                          <p className="font-medium">Get instant results</p>
                          <p className="text-sm text-muted-foreground">AI assessment with repair recommendations and pricing</p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
                <CardFooter className="flex gap-3">
                  <Button asChild variant="secondary" className="flex-1">
                    <Link to="/">Return to homepage</Link>
                  </Button>
                  <Button asChild className="flex-1">
                    <Link to="/report">Move to Results</Link>
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