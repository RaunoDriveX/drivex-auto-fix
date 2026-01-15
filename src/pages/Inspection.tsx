import { Helmet } from "react-helmet-async";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Copy, MessageCircle, Smartphone, ExternalLink, Camera, Home } from "lucide-react";
import { useState, useEffect } from "react";
import smartscanQrCode from "@/assets/smartscan-qr-code.png";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const Inspection = () => {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const { t, i18n } = useTranslation('common');
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

  // Static smartscan URL - use current language
  const smartscanUrl = `https://smartscan.drivex.ee/?urlId=FBLhLeT8gOim_Wb-g_SxybH_&lang=${i18n.language}`;
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(smartscanUrl);
      toast({ title: t('inspection.link_copied'), description: t('inspection.link_copied_desc') });
    } catch (err) {
      toast({ title: t('inspection.copy_failed'), description: t('inspection.copy_failed_desc'), variant: "destructive" });
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

  const title = token ? t('inspection.title') : t('inspection.invalid_link_title');

  return (
    <>
      <Helmet>
        <title>{title} | DriveX</title>
        <meta name="description" content="Self-service vehicle inspection via smartphone. Scan QR code or use direct link." />
        <link rel="canonical" href={typeof window !== "undefined" ? window.location.href : "/inspection/mock"} />
      </Helmet>

      <main className="bg-background py-10">
        <div className="container mx-auto max-w-2xl">
          {/* Header with navigation */}
          <div className="flex items-center justify-between mb-6">
            <Button asChild variant="ghost" size="sm">
              <Link to="/" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                {t('buttons.back_to_home')}
              </Link>
            </Button>
            <LanguageSwitcher />
          </div>

          {!token ? (
            <Card>
              <CardHeader>
                <CardTitle>{t('inspection.invalid_link_title')}</CardTitle>
                <CardDescription>{t('inspection.invalid_link_desc')}</CardDescription>
              </CardHeader>
              <CardFooter>
                <Button asChild>
                  <Link to="/">{t('buttons.back_to_home')}</Link>
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
                      {t('inspection.ready_title')}
                    </CardTitle>
                    <CardDescription>
                      {t('inspection.subtitle_mobile')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center space-y-4">
                    <div className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl border">
                      <Camera className="h-16 w-16 mx-auto text-primary mb-4" />
                      <p className="text-muted-foreground mb-4">
                        {t('inspection.tap_instruction')}
                      </p>
                      <Button 
                        onClick={startInspection}
                        size="lg"
                        className="w-full h-14 text-lg font-semibold"
                      >
                        {t('inspection.start_button')}
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
                      {t('inspection.title')}
                    </CardTitle>
                    <CardDescription>
                      {t('inspection.subtitle_desktop')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center space-y-4">
                    <div className="p-6 bg-white rounded-xl shadow-md border">
                      <img
                        src={smartscanQrCode}
                        alt="Scan QR code to start inspection"
                        className="w-60 h-60"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground text-center max-w-md">
                      {t('inspection.qr_instruction')}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('inspection.how_it_works')}</CardTitle>
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
                          <p className="font-medium">{t('inspection.step1_mobile_title')}</p>
                          <p className="text-sm text-muted-foreground">{t('inspection.step1_mobile_desc')}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-medium">
                          2
                        </div>
                        <div>
                          <p className="font-medium">{t('inspection.step2_mobile_title')}</p>
                          <p className="text-sm text-muted-foreground">{t('inspection.step2_mobile_desc')}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-medium">
                          3
                        </div>
                        <div>
                          <p className="font-medium">{t('inspection.step3_mobile_title')}</p>
                          <p className="text-sm text-muted-foreground">{t('inspection.step3_mobile_desc')}</p>
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
                          <p className="font-medium">{t('inspection.step1_desktop_title')}</p>
                          <p className="text-sm text-muted-foreground">{t('inspection.step1_desktop_desc')}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-medium">
                          2
                        </div>
                        <div>
                          <p className="font-medium">{t('inspection.step2_desktop_title')}</p>
                          <p className="text-sm text-muted-foreground">{t('inspection.step2_desktop_desc')}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-medium">
                          3
                        </div>
                        <div>
                          <p className="font-medium">{t('inspection.step3_desktop_title')}</p>
                          <p className="text-sm text-muted-foreground">{t('inspection.step3_desktop_desc')}</p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Alternative sharing methods - Show for desktop or as backup for mobile */}
              {!isMobile && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('inspection.cant_scan_title')}</CardTitle>
                    <CardDescription>
                      {t('inspection.cant_scan_desc')}
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
                      {t('inspection.send_sms')}
                    </Button>
                    <Button 
                      onClick={sendViaWhatsApp} 
                      className="flex items-center gap-2 h-12"
                      variant="outline"
                    >
                      <MessageCircle className="h-5 w-5" />
                      {t('inspection.send_whatsapp')}
                    </Button>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button 
                      onClick={copyToClipboard} 
                      variant="ghost" 
                      className="flex items-center gap-2 flex-1"
                    >
                      <Copy className="h-4 w-4" />
                      {t('inspection.copy_link')}
                    </Button>
                    <Button 
                      onClick={openInNewTab} 
                      variant="ghost" 
                      className="flex items-center gap-2 flex-1"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {t('inspection.open_browser')}
                    </Button>
                  </div>
                  
                  {/* Direct URL display */}
                  <div className="mt-4 p-3 bg-muted/30 rounded-md">
                    <Label className="text-xs text-muted-foreground">{t('inspection.inspection_link')}</Label>
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

              {/* Bottom navigation */}
              <Card>
                <CardFooter className="flex gap-3">
                  <Button asChild variant="secondary" className="flex-1">
                    <Link to="/">{t('inspection.return_home')}</Link>
                  </Button>
                  <Button asChild className="flex-1">
                    <Link to={`/report/${token}`}>{t('inspection.move_to_results')}</Link>
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
