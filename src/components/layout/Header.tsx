import { Button } from "@/components/ui/button";
import { Menu, X, Phone, Mail, Search } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import CallCenterToolbarWidget from "@/components/call-center/CallCenterToolbarWidget";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Safely check location to avoid white screen issues
  let showCallCenter = false;
  try {
    const location = useLocation();
    showCallCenter = location.pathname.startsWith('/shop');
  } catch (error) {
    console.log('Header: Location hook error, defaulting to hide call center');
  }

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "How it Works", href: "#workflow" },
    { name: "About Us", href: "#about" },
    { name: "Contact", href: "#contact" },
    { name: "Shop Portal", href: "/shop-auth" }
  ];

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-24 gap-8">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link to="/" className="flex items-center py-2 hover:opacity-80 transition-opacity duration-200">
              <img 
                src="/lovable-uploads/df12f014-4490-43bd-b853-4dd0b472d367.png" 
                alt="Autocristal - Auto Glass Repair & Replacement" 
                className="h-20 w-auto max-w-[240px] object-contain" 
              />
            </Link>
          </div>

          {/* Track Job CTA - Prominent Position */}
          <div className="hidden md:flex items-center flex-1 justify-center px-8">
            <Link to="/track">
              <Button variant="outline" className="flex items-center gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground px-6 py-3 text-base font-semibold">
                <Search className="h-5 w-5" />
                Track Your Job
              </Button>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6 flex-shrink-0">
            {navLinks.map((link) => {
              if (link.href.startsWith('/')) {
                return (
                  <Link
                    key={link.name}
                    to={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors font-medium"
                  >
                    {link.name}
                  </Link>
                );
              }
              return (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  {link.name}
                </a>
              );
            })}
          </nav>

          {/* Contact Info & Call Center */}
          <div className="hidden lg:flex items-center gap-6 flex-shrink-0">
            {showCallCenter && <CallCenterToolbarWidget />}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>+372 58528824</span>
            </div>
            <Link to="/insurer-auth">
              <Button variant="outline" size="sm">
                Insurer Login
              </Button>
            </Link>
            <Button size="sm">
              Get Started
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border py-4">
            {/* Mobile Track Job CTA */}
            <div className="mb-4 pb-4 border-b border-border">
              <Link to="/track" onClick={() => setIsMenuOpen(false)}>
                <Button className="w-full flex items-center justify-center gap-2">
                  <Search className="h-4 w-4" />
                  Track Your Job
                </Button>
              </Link>
            </div>
            
            <nav className="flex flex-col space-y-4">
              {navLinks.map((link) => {
                if (link.href.startsWith('/')) {
                  return (
                    <Link
                      key={link.name}
                      to={link.href}
                      className="text-muted-foreground hover:text-foreground transition-colors font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {link.name}
                    </Link>
                  );
                }
                return (
                  <a
                    key={link.name}
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.name}
                  </a>
                );
              })}
              <div className="pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <Phone className="h-4 w-4" />
                  <span>+372 58528824</span>
                </div>
                <div className="space-y-2">
                  <Link to="/insurer-auth">
                    <Button variant="outline" size="sm" className="w-full">
                      Insurer Login
                    </Button>
                  </Link>
                  <Button size="sm" className="w-full">
                    Get Started
                  </Button>
                </div>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;