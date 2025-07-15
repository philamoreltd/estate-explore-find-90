import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin } from "lucide-react";
import heroImage from "@/assets/hero-house.jpg";

const HeroSection = () => {
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
                  />
                </div>
              </div>
              
              <select className="h-12 px-4 rounded-md border border-real-estate-gray/20 focus:border-real-estate-blue outline-none">
                <option>Property Type</option>
                <option>Bedsitters</option>
                <option>Single Rooms</option>
                <option>One Bedrooms</option>
                <option>Two Bedrooms</option>
                <option>Three Bedrooms</option>
                <option>Apartments</option>
                <option>Business Rooms</option>
                <option>Offices</option>
                <option>Lodgings</option>
                <option>BNB</option>
              </select>
              
              <Button variant="search" size="lg" className="h-12">
                <Search className="h-5 w-5 mr-2" />
                Search
              </Button>
            </div>
            
            {/* Quick Filters */}
            <div className="flex flex-wrap gap-3 mt-6 justify-center">
              <Button variant="property" size="sm">Monthly Rent</Button>
              <Button variant="property" size="sm">Furnished</Button>
              <Button variant="property" size="sm">Unfurnished</Button>
              <Button variant="property" size="sm">Short Term</Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;