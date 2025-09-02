import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Home, Search, Heart, User, Menu, LogOut, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Navigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      });
      navigate("/");
    } catch (error) {
      console.error("Sign out error:", error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleMobileNavigation = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };
  return (
    <nav className="bg-white shadow-card border-b border-real-estate-gray/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Home className="h-8 w-8 text-real-estate-blue mr-2" />
              <span className="text-2xl font-bold text-real-estate-navy">
                Housevilla Hub
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <a href="/" className="text-real-estate-navy hover:text-real-estate-blue transition-colors duration-200 px-3 py-2 text-sm font-medium">
                Home
              </a>
              <a href="/browse" className="text-real-estate-navy hover:text-real-estate-blue transition-colors duration-200 px-3 py-2 text-sm font-medium">
                Browse Rentals
              </a>
              <a href="/tenants" className="text-real-estate-navy hover:text-real-estate-blue transition-colors duration-200 px-3 py-2 text-sm font-medium">
                Add Property
              </a>
              <a href="/landlords" className="text-real-estate-navy hover:text-real-estate-blue transition-colors duration-200 px-3 py-2 text-sm font-medium">
                Landlords
              </a>
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" size="sm">
              <Heart className="h-4 w-4 mr-2" />
              Saved
            </Button>
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-real-estate-navy">
                  Hello, {user.user_metadata?.full_name || user.email}
                </span>
                {user.email === 'antonygmurimi@gmail.com' && (
                  <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}>
                    Admin Panel
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => navigate("/auth")}>
                <User className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            )}
            <Button variant="hero" size="sm" onClick={() => navigate("/tenants")}>
              List Rental
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu Panel */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-real-estate-gray/10">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white">
              {/* Mobile Navigation Links */}
              <button
                onClick={() => handleMobileNavigation('/')}
                className="block w-full text-left px-3 py-2 text-real-estate-navy hover:text-real-estate-blue hover:bg-gray-50 transition-colors duration-200 text-base font-medium"
              >
                Home
              </button>
              <button
                onClick={() => handleMobileNavigation('/browse')}
                className="block w-full text-left px-3 py-2 text-real-estate-navy hover:text-real-estate-blue hover:bg-gray-50 transition-colors duration-200 text-base font-medium"
              >
                Browse Rentals
              </button>
              <button
                onClick={() => handleMobileNavigation('/tenants')}
                className="block w-full text-left px-3 py-2 text-real-estate-navy hover:text-real-estate-blue hover:bg-gray-50 transition-colors duration-200 text-base font-medium"
              >
                Add Property
              </button>
              <button
                onClick={() => handleMobileNavigation('/landlords')}
                className="block w-full text-left px-3 py-2 text-real-estate-navy hover:text-real-estate-blue hover:bg-gray-50 transition-colors duration-200 text-base font-medium"
              >
                Landlords
              </button>
              
              {/* Mobile Actions */}
              <div className="border-t border-real-estate-gray/10 pt-4 mt-4 space-y-2">
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  <Heart className="h-4 w-4 mr-2" />
                  Saved
                </Button>
                
                {user ? (
                  <div className="space-y-2">
                    <div className="px-3 py-2 text-sm text-real-estate-navy border-b border-real-estate-gray/10">
                      Hello, {user.user_metadata?.full_name || user.email}
                    </div>
                    {user.email === 'antonygmurimi@gmail.com' && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full justify-start"
                        onClick={() => handleMobileNavigation("/admin")}
                      >
                        Admin Panel
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
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => handleMobileNavigation("/auth")}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Sign In
                  </Button>
                )}
                
                <Button 
                  variant="hero" 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleMobileNavigation("/tenants")}
                >
                  List Rental
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