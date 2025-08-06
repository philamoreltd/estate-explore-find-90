import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PropertyCard from "./PropertyCard";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
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
  created_at: string;
}

const FeaturedProperties = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchFeaturedProperties();
  }, []);

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
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-real-estate-navy mb-4">
            Featured Rentals
          </h2>
          <p className="text-lg text-real-estate-gray max-w-2xl mx-auto">
            Discover our handpicked selection of exceptional rental properties in prime locations
          </p>
        </div>

        {/* Properties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {properties.slice(0, 3).map((property) => (
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