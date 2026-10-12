import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin } from "lucide-react";
import heroImage from "@/assets/hero-house.jpg";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface HeroSectionProps {
  onSearch?: (filters: {
    location: string;
    propertyType: string;
    furnished?: string;
    rentalTerm?: string;
  }) => void;
}

const HeroSection = ({ onSearch }: HeroSectionProps) => {
  const [location, setLocation] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("");
  const navigate = useNavigate();

  const handleSearch = () => {
    const filters = {
      location,
      propertyType,
      furnished: activeFilter === "furnished" ? "true" : activeFilter === "unfurnished" ? "false" : undefined,
      rentalTerm: activeFilter === "short-term" ? "short-term" : activeFilter === "monthly" ? "monthly" : undefined,
    };
    
    if (onSearch) {
      onSearch(filters);
    } else {
      // Navigate to browse page with search params
      const searchParams = new URLSearchParams();
      if (location) searchParams.set('location', location);
      if (propertyType) searchParams.set('propertyType', propertyType);
      if (filters.furnished !== undefined) searchParams.set('furnished', filters.furnished);
      if (filters.rentalTerm) searchParams.set('rentalTerm', filters.rentalTerm);
      
      navigate(`/browse?${searchParams.toString()}`);
    }
  };

  const handleFilterClick = (filter: string) => {
    setActiveFilter(activeFilter === filter ? "" : filter);
  };

  return (
    <section className="relative h-[600px] bg-gradient-hero overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      
      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
        <div className="text-center w-full">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 animate-fade-in">
            Find Your Perfect
            <span className="block text-real-estate-gold">Rental Home</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto animate-slide-up">
            Discover thousands of rental properties available in Kenya
          </p>

          {/* Search Bar */}
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-hover p-6 animate-scale-in">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-5 w-5 text-real-estate-gray" />
                  <Input 
                    placeholder="Enter city, neighborhood, or ZIP code"
                    className="pl-10 h-12 text-base border-real-estate-gray/20 focus:border-real-estate-blue"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>
              
              <select 
                className="h-12 px-4 rounded-md border border-real-estate-gray/20 focus:border-real-estate-blue outline-none"
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
              >
                <option value="">Property Type</option>
                <option value="bnb">BnB</option>
                <option value="bedsitter">Bedsitter</option>
                <option value="single-room">Single Room</option>
                <option value="one-bedroom">One-Bedroom</option>
                <option value="two-bedroom">Two-Bedroom</option>
                <option value="three-bedroom">Three-Bedroom</option>
                <option value="maisonette">Maisonette</option>
                <option value="bungalow">Bungalow</option>
                <option value="compound-house">Compound House</option>
              </select>
              
              <Button variant="search" size="lg" className="h-12" onClick={handleSearch}>
                <Search className="h-5 w-5 mr-2" />
                Search
              </Button>
            </div>
            
            {/* Quick Filters */}
            <div className="flex flex-wrap gap-3 mt-6 justify-center">
              <Button 
                variant={activeFilter === "monthly" ? "search" : "property"} 
                size="sm"
                onClick={() => handleFilterClick("monthly")}
              >
                Monthly Rent
              </Button>
              <Button 
                variant={activeFilter === "furnished" ? "search" : "property"} 
                size="sm"
                onClick={() => handleFilterClick("furnished")}
              >
                Furnished
              </Button>
              <Button 
                variant={activeFilter === "unfurnished" ? "search" : "property"} 
                size="sm"
                onClick={() => handleFilterClick("unfurnished")}
              >
                Unfurnished
              </Button>
              <Button 
                variant={activeFilter === "short-term" ? "search" : "property"} 
                size="sm"
                onClick={() => handleFilterClick("short-term")}
              >
                Short Term
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;