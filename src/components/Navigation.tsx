import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Laptop, LogOut, Menu, MessageCircle, User, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useShopSettings } from "@/hooks/useShopSettings";
import { useToast } from "@/hooks/use-toast";
import { enquiryMessage, whatsappLink } from "@/lib/shop";

const links = [
  { label: "Home", path: "/" },
  { label: "Laptops", path: "/shop?category=laptops" },
  { label: "Accessories", path: "/shop?category=accessories" },
  { label: "All Products", path: "/shop" },
  { label: "Contact", path: "/contact" },
];

const Navigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { settings } = useShopSettings();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({ title: "Signed out", description: "You have been signed out." });
      navigate("/");
    } catch {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const go = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 shadow-card backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Laptop className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold text-foreground">
              {settings.shop_name}
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {links.map((link) => (
              <Link
                key={link.label}
                to={link.path}
                className="text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                {isAdmin && (
                  <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}>
                    Admin
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={() => navigate("/auth")}>
                <User className="mr-2 h-4 w-4" />
                Sign In
              </Button>
            )}
            <Button asChild size="sm">
              <a
                href={whatsappLink(settings.whatsapp_number, enquiryMessage())}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                WhatsApp Us
              </a>
            </Button>
          </div>

          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="border-t border-border md:hidden">
            <div className="space-y-1 py-3">
              {links.map((link) => (
                <button
                  key={link.label}
                  onClick={() => go(link.path)}
                  className="block w-full px-3 py-2 text-left text-base font-medium text-foreground/90 hover:bg-muted"
                >
                  {link.label}
                </button>
              ))}
              <div className="mt-3 space-y-2 border-t border-border pt-3">
                {user ? (
                  <>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => go("/admin")}
                      >
                        Admin
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        handleSignOut();
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => go("/auth")}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Sign In
                  </Button>
                )}
                <Button asChild size="sm" className="w-full">
                  <a
                    href={whatsappLink(settings.whatsapp_number, enquiryMessage())}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    WhatsApp Us
                  </a>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
