import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PropertyCard from "./PropertyCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
}

const FeaturedPropertiesCarousel = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
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
  }, []);

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

      setProperties(data || []);
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
            {properties.map((property) => (
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
