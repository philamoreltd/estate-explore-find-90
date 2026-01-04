import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PropertyCard from "./PropertyCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, ChevronLeft, ChevronRight, Search, Filter, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getCurrentLocation, calculateDistance, type LocationData } from "@/utils/location";
import useEmblaCarousel from "embla-carousel-react";

interface Property {
  id: string;
  user_id: string;
  title: string;
  rent_amount: number;
  location: string;
  latitude: number | null;
  longitude: number | null;
  bedrooms: number;
  bathrooms: number;
  size_sqft: number | null;
  property_type: string;
  image_url: string | null;
  image_urls: string[] | null;
  description: string | null;
  created_at: string;
  distance?: number;
}

const FeaturedPropertiesCarousel = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [maxRent, setMaxRent] = useState("");
  const [furnishedStatus, setFurnishedStatus] = useState("");
  const [rentalTerm, setRentalTerm] = useState("");
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const { toast } = useToast();
  
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    slidesToScroll: 1,
  });
  
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    fetchFeaturedProperties();
  }, [userLocation]);

  useEffect(() => {
    filterProperties();
  }, [properties, searchTerm, propertyType, maxRent, furnishedStatus, rentalTerm]);

  const fetchFeaturedProperties = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_properties_with_conditional_phone')
        .eq('status', 'available')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching properties:', error);
        toast({
          title: "Error",
          description: "Failed to load featured properties",
          variant: "destructive",
        });
        return;
      }

      let propertiesWithDistance = data || [];
      if (userLocation) {
        propertiesWithDistance = propertiesWithDistance.map(property => ({
          ...property,
          distance: property.latitude && property.longitude 
            ? calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                property.latitude,
                property.longitude
              )
            : undefined
        }));
      }

      setProperties(propertiesWithDistance);
      setFilteredProperties(propertiesWithDistance);
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

  const getUserLocation = async () => {
    setLocationLoading(true);
    try {
      const location = await getCurrentLocation();
      setUserLocation(location);
      toast({
        title: "Location found",
        description: "Properties will now show distance from your location",
      });
    } catch (error) {
      toast({
        title: "Location access failed",
        description: error instanceof Error ? error.message : "Could not access your location",
        variant: "destructive",
      });
    } finally {
      setLocationLoading(false);
    }
  };

  const filterProperties = () => {
    let filtered = properties;

    if (searchTerm) {
      filtered = filtered.filter(property =>
        property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (propertyType && propertyType !== "all") {
      filtered = filtered.filter(property =>
        property.property_type.toLowerCase() === propertyType.toLowerCase()
      );
    }

    if (maxRent && maxRent !== "all") {
      const maxRentNumber = parseInt(maxRent);
      filtered = filtered.filter(property => property.rent_amount <= maxRentNumber);
    }

    if (furnishedStatus && furnishedStatus !== "all") {
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
    return diffDays <= 7;
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
              Discover our handpicked selection of exceptional rental properties
            </p>
          </div>
          <div className="flex gap-6 overflow-hidden">
            {[1, 2, 3].map((i) => (
              <div key={i} className="min-w-[320px] bg-white rounded-xl shadow-card overflow-hidden animate-pulse">
                <div className="h-48 bg-muted"></div>
                <div className="p-5">
                  <div className="h-6 bg-muted rounded mb-3"></div>
                  <div className="h-4 bg-muted rounded mb-3 w-2/3"></div>
                  <div className="flex gap-4 mb-4">
                    <div className="h-4 bg-muted rounded w-16"></div>
                    <div className="h-4 bg-muted rounded w-16"></div>
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-real-estate-navy mb-2">
              Featured Rentals
            </h2>
            <p className="text-lg text-real-estate-gray">
              Handpicked properties in prime locations
            </p>
          </div>
          
          {/* Navigation Arrows */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={scrollPrev}
              disabled={!canScrollPrev}
              className="rounded-full border-real-estate-blue text-real-estate-blue hover:bg-real-estate-blue hover:text-white disabled:opacity-50"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={scrollNext}
              disabled={!canScrollNext}
              className="rounded-full border-real-estate-blue text-real-estate-blue hover:bg-real-estate-blue hover:text-white disabled:opacity-50"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Carousel */}
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-6">
            {filteredProperties.map((property) => (
              <div 
                key={property.id} 
                className="flex-[0_0_100%] sm:flex-[0_0_50%] lg:flex-[0_0_33.333%] min-w-0"
              >
                <PropertyCard
                  id={property.id}
                  image={getPropertyImage(property)}
                  imageUrls={property.image_urls}
                  price={formatPrice(property.rent_amount)}
                  address={property.title}
                  city={property.location}
                  beds={property.bedrooms}
                  baths={property.bathrooms}
                  sqft={property.size_sqft || 1000}
                  type="For Rent"
                  isNew={isNewProperty(property.created_at)}
                  landlordId={property.user_id}
                  contact={(property as any).contact}
                />
              </div>
            ))}
          </div>
        </div>

        {/* No Results Message */}
        {filteredProperties.length === 0 && properties.length > 0 && (
          <div className="text-center py-8">
            <p className="text-real-estate-gray">No properties match your filters. Try adjusting your search.</p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-card rounded-xl shadow-card p-6 mt-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-real-estate-blue" />
            <h3 className="text-lg font-semibold text-real-estate-navy">Filter Properties</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-4">
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
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Property Type" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
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
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Max Rent" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="all">Any Price</SelectItem>
                <SelectItem value="25000">Up to Ksh 25K</SelectItem>
                <SelectItem value="50000">Up to Ksh 50K</SelectItem>
                <SelectItem value="75000">Up to Ksh 75K</SelectItem>
                <SelectItem value="100000">Up to Ksh 100K</SelectItem>
                <SelectItem value="150000">Up to Ksh 150K</SelectItem>
                <SelectItem value="200000">Up to Ksh 200K</SelectItem>
              </SelectContent>
            </Select>

            {/* Furnished Status */}
            <Select value={furnishedStatus} onValueChange={setFurnishedStatus}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Furnished" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="all">Any</SelectItem>
                <SelectItem value="furnished">Furnished</SelectItem>
                <SelectItem value="unfurnished">Unfurnished</SelectItem>
              </SelectContent>
            </Select>

            {/* Rental Term */}
            <Select value={rentalTerm} onValueChange={setRentalTerm}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Rental Term" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
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

          {/* Location Button */}
          <div className="flex justify-center">
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={getUserLocation}
              disabled={locationLoading}
            >
              <Target className="h-4 w-4" />
              {locationLoading ? "Getting Location..." : userLocation ? "Location Found" : "Use My Location"}
            </Button>
          </div>
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
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

export default FeaturedPropertiesCarousel;
