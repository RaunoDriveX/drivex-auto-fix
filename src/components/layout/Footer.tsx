import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="contact" className="bg-muted/30 border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Company Info */}
          <div>
            <div className="text-2xl font-bold text-primary mb-4">Glassify</div>
            <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
              Patent-pending AI technology for transparent auto glass repair. 
              Your advocate in the marketplace.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>+52 55 1234 5678</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>contact@glassify.com</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Ciudad de México, México</span>
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Services</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">AI Damage Assessment</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Repair Shop Matching</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Mobile Glass Repair</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Fleet Solutions</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">DIY Repair Kits</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Insurance Claims</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">About Us</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Our Team</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Careers</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">News & Press</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Partner Network</a></li>
              <li><a href="mailto:contact@glassify.com" className="text-muted-foreground hover:text-foreground transition-colors">Contact Us</a></li>
            </ul>
          </div>

          {/* Legal & Support */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Legal & Support</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Cookie Policy</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Help Center</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Support</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Warranty</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            
            {/* Copyright */}
            <div className="text-sm text-muted-foreground">
              © {currentYear} Glassify. All rights reserved. Patent pending technology.
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Follow us:</span>
              <div className="flex gap-3">
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <Twitter className="h-5 w-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <Linkedin className="h-5 w-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              Operating in Europe, North America, Latin America, and Africa. 
              Over 300,000 assessments completed with 95% accuracy.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;