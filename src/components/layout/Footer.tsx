import { useTranslation } from "react-i18next";
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram } from "lucide-react";

const Footer = () => {
  const { t } = useTranslation('marketing');
  const currentYear = new Date().getFullYear();

  return (
    <footer id="contact" className="bg-muted/30 border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="text-2xl font-bold text-primary mb-4">Glassify</div>
            <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
              {t('footer.tagline')}
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>+49 30 1234 5678</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>contact@glassify24.com</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Germany</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">{t('footer.services')}</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">{t('footer.ai_assessment')}</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">{t('footer.shop_matching')}</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">{t('footer.mobile_repair')}</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">{t('footer.fleet_solutions')}</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">{t('footer.diy_kits')}</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">{t('footer.insurance_claims')}</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">{t('footer.company')}</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">{t('footer.about_us')}</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">{t('footer.our_team')}</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">{t('footer.careers')}</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">{t('footer.news_press')}</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">{t('footer.partner_network')}</a></li>
              <li><a href="mailto:contact@glassify24.com" className="text-muted-foreground hover:text-foreground transition-colors">{t('footer.contact_us')}</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">{t('footer.legal_support')}</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">{t('footer.privacy_policy')}</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">{t('footer.terms_of_service')}</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">{t('footer.cookie_policy')}</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">{t('footer.help_center')}</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">{t('footer.support')}</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">{t('footer.warranty')}</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              {t('footer.copyright', { year: currentYear })}
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{t('footer.follow_us')}</span>
              <div className="flex gap-3">
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Facebook className="h-5 w-5" /></a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Twitter className="h-5 w-5" /></a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Linkedin className="h-5 w-5" /></a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Instagram className="h-5 w-5" /></a>
              </div>
            </div>
          </div>
          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">{t('footer.operating_regions')}</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
