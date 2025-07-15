import { Button } from "@/components/ui/button";
import { Home, Search, Heart, User, Menu } from "lucide-react";

const Navigation = () => {
  return (
    <nav className="bg-white shadow-card border-b border-real-estate-gray/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Home className="h-8 w-8 text-real-estate-blue mr-2" />
              <span className="text-2xl font-bold text-real-estate-navy">
                NyumbaLink
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <a href="#" className="text-real-estate-navy hover:text-real-estate-blue transition-colors duration-200 px-3 py-2 text-sm font-medium">
                Browse Rentals
              </a>
              <a href="/tenants" className="text-real-estate-navy hover:text-real-estate-blue transition-colors duration-200 px-3 py-2 text-sm font-medium">
                Add Property
              </a>
              <a href="#" className="text-real-estate-navy hover:text-real-estate-blue transition-colors duration-200 px-3 py-2 text-sm font-medium">
                Landlords
              </a>
              <a href="#" className="text-real-estate-navy hover:text-real-estate-blue transition-colors duration-200 px-3 py-2 text-sm font-medium">
                Tenants
              </a>
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" size="sm">
              <Heart className="h-4 w-4 mr-2" />
              Saved
            </Button>
            <Button variant="outline" size="sm">
              <User className="h-4 w-4 mr-2" />
              Sign In
            </Button>
            <Button variant="hero" size="sm">
              List Rental
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;