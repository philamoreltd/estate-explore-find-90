import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PropertyCard from "./PropertyCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Search, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Property {
  id: string;
  user_id: string;
  title: string;
  rent_amount: number;
  location: string;
  bedrooms: number;
  bathrooms: number;
  size_sqft: number | null;
  property_type: string;
  image_url: string | null;
  image_urls: string[] | null;
  description: string | null;
  created_at: string;
}

const FeaturedProperties = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [maxRent, setMaxRent] = useState("");
  const [furnishedStatus, setFurnishedStatus] = useState("");
  const [rentalTerm, setRentalTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchFeaturedProperties();
  }, []);

  useEffect(() => {
    filterProperties();
  }, [properties, searchTerm, propertyType, maxRent, furnishedStatus, rentalTerm]);

  const fetchFeaturedProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'available')
        .order('created_at', { ascending: false })
        .limit(6); // Show 6 featured properties

      if (error) {
        console.error('Error fetching properties:', error);
        toast({
          title: "Error",
          description: "Failed to load featured properties",
          variant: "destructive",
        });
        return;
      }

      setProperties(data || []);
      setFilteredProperties(data || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast({
        title: "Error", 
        description: "Failed to load featured properties",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterProperties = () => {
    let filtered = properties;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(property =>
        property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Property type filter
    if (propertyType && propertyType !== "all") {
      filtered = filtered.filter(property =>
        property.property_type.toLowerCase() === propertyType.toLowerCase()
      );
    }

    // Rent filter
    if (maxRent && maxRent !== "all") {
      const maxRentNumber = parseInt(maxRent);
      filtered = filtered.filter(property => property.rent_amount <= maxRentNumber);
    }

    // Furnished status filter
    if (furnishedStatus && furnishedStatus !== "all") {
      // This would need a furnished field in the database - for now, we'll filter by description
      if (furnishedStatus === "furnished") {
        filtered = filtered.filter(property =>
          property.description?.toLowerCase().includes("furnished") ||
          property.title.toLowerCase().includes("furnished")
        );
      } else if (furnishedStatus === "unfurnished") {
        filtered = filtered.filter(property =>
          !property.description?.toLowerCase().includes("furnished") &&
          !property.title.toLowerCase().includes("furnished")
        );
      }
    }

    // Rental term filter
    if (rentalTerm && rentalTerm !== "all") {
      if (rentalTerm === "short-term") {
        filtered = filtered.filter(property =>
          property.property_type.toLowerCase().includes("bnb") ||
          property.property_type.toLowerCase().includes("lodging") ||
          property.description?.toLowerCase().includes("short term") ||
          property.description?.toLowerCase().includes("weekly") ||
          property.description?.toLowerCase().includes("daily")
        );
      } else if (rentalTerm === "long-term") {
        filtered = filtered.filter(property =>
          !property.property_type.toLowerCase().includes("bnb") &&
          !property.property_type.toLowerCase().includes("lodging")
        );
      }
    }

    setFilteredProperties(filtered);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setPropertyType("all");
    setMaxRent("all");
    setFurnishedStatus("all");
    setRentalTerm("all");
  };

  const formatPrice = (amount: number) => {
    return `Ksh ${amount.toLocaleString()}/month`;
  };

  const getPropertyImage = (property: Property) => {
    // Use first image from image_urls array, fallback to image_url, then to placeholder
    if (property.image_urls && property.image_urls.length > 0) {
      return property.image_urls[0];
    }
    if (property.image_url) {
      return property.image_url;
    }
    return "/placeholder.svg";
  };

  const isNewProperty = (createdAt: string) => {
    const createdDate = new Date(createdAt);
    const nowDate = new Date();
    const diffTime = nowDate.getTime() - createdDate.getTime();
    const diffDays = diffTime / (1000 * 3600 * 24);
    return diffDays <= 7; // Property is "new" if created within last 7 days
  };

  if (loading) {
    return (
      <section className="py-16 bg-gradient-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-real-estate-navy mb-4">
              Featured Rentals
            </h2>
            <p className="text-lg text-real-estate-gray max-w-2xl mx-auto">
              Discover our handpicked selection of exceptional rental properties in prime locations
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-card overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-5">
                  <div className="h-6 bg-gray-200 rounded mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded mb-3 w-2/3"></div>
                  <div className="flex gap-4 mb-4">
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                  <div className="flex gap-2 pt-3">
                    <div className="h-8 bg-gray-200 rounded flex-1"></div>
                    <div className="h-8 bg-gray-200 rounded flex-1"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (properties.length === 0) {
    return (
      <section className="py-16 bg-gradient-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-real-estate-navy mb-4">
              Featured Rentals
            </h2>
            <p className="text-lg text-real-estate-gray max-w-2xl mx-auto">
              No properties available at the moment. Check back soon!
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gradient-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-real-estate-navy mb-4">
            Featured Rentals
          </h2>
          <p className="text-lg text-real-estate-gray max-w-2xl mx-auto">
            Discover our handpicked selection of exceptional rental properties in prime locations
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-card p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-real-estate-blue" />
            <h3 className="text-lg font-semibold text-real-estate-navy">Filter Properties</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-real-estate-gray" />
              <Input
                placeholder="Search location or title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Property Type */}
            <Select value={propertyType} onValueChange={setPropertyType}>
              <SelectTrigger>
                <SelectValue placeholder="Property Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="apartment">Apartment</SelectItem>
                <SelectItem value="house">House</SelectItem>
                <SelectItem value="studio">Studio</SelectItem>
                <SelectItem value="condo">Condo</SelectItem>
                <SelectItem value="bnb">BnB</SelectItem>
                <SelectItem value="lodging">Lodging</SelectItem>
              </SelectContent>
            </Select>

            {/* Monthly Rent */}
            <Select value={maxRent} onValueChange={setMaxRent}>
              <SelectTrigger>
                <SelectValue placeholder="Max Rent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Price</SelectItem>
                <SelectItem value="25000">Up to Ksh 25K</SelectItem>
                <SelectItem value="50000">Up to Ksh 50K</SelectItem>
                <SelectItem value="75000">Up to Ksh 75K</SelectItem>
                <SelectItem value="100000">Up to Ksh 100K</SelectItem>
                <SelectItem value="150000">Up to Ksh 150K</SelectItem>
                <SelectItem value="200000">Up to Ksh 200K</SelectItem>
                <SelectItem value="250000">Up to Ksh 250K</SelectItem>
                <SelectItem value="300000">Up to Ksh 300K</SelectItem>
              </SelectContent>
            </Select>

            {/* Furnished Status */}
            <Select value={furnishedStatus} onValueChange={setFurnishedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Furnished" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any</SelectItem>
                <SelectItem value="furnished">Furnished</SelectItem>
                <SelectItem value="unfurnished">Unfurnished</SelectItem>
              </SelectContent>
            </Select>

            {/* Rental Term */}
            <Select value={rentalTerm} onValueChange={setRentalTerm}>
              <SelectTrigger>
                <SelectValue placeholder="Rental Term" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Term</SelectItem>
                <SelectItem value="short-term">Short Term</SelectItem>
                <SelectItem value="long-term">Long Term</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            <Button 
              variant="outline" 
              onClick={clearFilters}
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Properties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {filteredProperties.slice(0, 6).map((property) => (
            <PropertyCard
              key={property.id}
              id={property.id}
              image={getPropertyImage(property)}
              price={formatPrice(property.rent_amount)}
              address={property.title}
              city={property.location}
              beds={property.bedrooms}
              baths={property.bathrooms}
              sqft={property.size_sqft || 1000}
              type="For Rent"
              isNew={isNewProperty(property.created_at)}
              landlordId={property.user_id}
            />
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Button 
            variant="hero" 
            size="lg"
            onClick={() => navigate('/browse')}
          >
            View All Rentals
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProperties;