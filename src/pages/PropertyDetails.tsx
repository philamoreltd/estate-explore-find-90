import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Bed, Bath, Square, Calendar, User, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Navigation from "@/components/Navigation";
import ContactModal from "@/components/ContactModal";
import ScheduleViewingModal from "@/components/ScheduleViewingModal";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Property {
  id: string;
  title: string;
  property_type: string;
  rent_amount: number;
  location: string;
  bedrooms: number;
  bathrooms: number;
  size_sqft: number | null;
  description: string | null;
  image_url: string | null;
  status: string;
  created_at: string;
  user_id: string;
}

interface LandlordProfile {
  full_name: string | null;
  phone: string | null;
  email: string | null;
}

const PropertyDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [landlordProfile, setLandlordProfile] = useState<LandlordProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (id) {
      fetchProperty(id);
    }
  }, [id]);

  const fetchProperty = async (propertyId: string) => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();

      if (error) {
        console.error('Error fetching property:', error);
        toast({
          title: "Error",
          description: "Failed to load property details. Please try again.",
          variant: "destructive",
        });
        navigate('/browse');
        return;
      }

      setProperty(data);
      
      // Fetch landlord profile information
      if (data.user_id) {
        await fetchLandlordProfile(data.user_id);
      }
    } catch (error) {
      console.error('Error fetching property:', error);
      toast({
        title: "Error",
        description: "Failed to load property details.",
        variant: "destructive",
      });
      navigate('/browse');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLandlordProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, phone, email')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching landlord profile:', error);
        return;
      }

      setLandlordProfile(data);
    } catch (error) {
      console.error('Error fetching landlord profile:', error);
    }
  };

  const maskPhoneNumber = (phone: string | null) => {
    if (!phone) return "Not provided";
    if (user) return phone; // Show full number if authenticated
    
    // Mask last 3 digits for unauthenticated users
    if (phone.length >= 3) {
      return phone.slice(0, -3) + 'XXX';
    }
    return 'XXX';
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-96 bg-gray-200 rounded-lg mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-real-estate-navy mb-4">Property Not Found</h1>
            <p className="text-real-estate-gray mb-6">The property you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/browse')}>Back to Browse</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/browse')}
          className="mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Browse
        </Button>

        {/* Property Image */}
        <div className="aspect-video w-full mb-8 rounded-lg overflow-hidden">
          {property.image_url ? (
            <img
              src={property.image_url}
              alt={property.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-real-estate-gray/10 flex items-center justify-center">
              <span className="text-real-estate-gray text-lg">No Image Available</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Property Details */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="secondary">{property.property_type}</Badge>
                <Badge 
                  variant={property.status === 'available' ? 'default' : 'destructive'}
                >
                  {property.status}
                </Badge>
              </div>
              
              <h1 className="text-3xl font-bold text-real-estate-navy mb-2">
                {property.title}
              </h1>
              
              <div className="flex items-center gap-2 text-real-estate-gray mb-4">
                <MapPin className="h-5 w-5" />
                <span className="text-lg">{property.location}</span>
              </div>

              <div className="flex items-center gap-6 text-real-estate-gray">
                <div className="flex items-center gap-2">
                  <Bed className="h-5 w-5" />
                  <span>{property.bedrooms} Bedroom{property.bedrooms !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bath className="h-5 w-5" />
                  <span>{property.bathrooms} Bathroom{property.bathrooms !== 1 ? 's' : ''}</span>
                </div>
                {property.size_sqft && (
                  <div className="flex items-center gap-2">
                    <Square className="h-5 w-5" />
                    <span>{property.size_sqft} sq ft</span>
                  </div>
                )}
              </div>
            </div>

            <Separator className="my-6" />

            {/* Description */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-real-estate-navy mb-3">Description</h2>
              <p className="text-real-estate-gray leading-relaxed">
                {property.description || "No description available for this property."}
              </p>
            </div>

            <Separator className="my-6" />

            {/* Property Information */}
            <div>
              <h2 className="text-xl font-semibold text-real-estate-navy mb-3">Property Information</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-real-estate-gray">Property Type:</span>
                  <p className="font-medium">{property.property_type}</p>
                </div>
                <div>
                  <span className="text-real-estate-gray">Status:</span>
                  <p className="font-medium capitalize">{property.status}</p>
                </div>
                <div>
                  <span className="text-real-estate-gray">Listed On:</span>
                  <p className="font-medium">{formatDate(property.created_at)}</p>
                </div>
                {property.size_sqft && (
                  <div>
                    <span className="text-real-estate-gray">Size:</span>
                    <p className="font-medium">{property.size_sqft} sq ft</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contact Card */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-real-estate-blue mb-1">
                    {formatPrice(property.rent_amount)}
                  </div>
                  <div className="text-real-estate-gray">
                    {property.property_type.toLowerCase() === 'lodging' || property.property_type.toLowerCase() === 'bnb' 
                      ? '/24hrs' 
                      : '/month'
                    }
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="space-y-4">
                  {landlordProfile?.phone ? (
                    user ? (
                      <Button 
                        className="w-full" 
                        size="lg"
                        onClick={() => window.open(`tel:${landlordProfile.phone}`, '_self')}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Call {landlordProfile.phone}
                      </Button>
                    ) : (
                      <Button 
                        className="w-full" 
                        size="lg"
                        onClick={() => navigate('/auth')}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Sign in to view phone number
                      </Button>
                    )
                  ) : (
                    <Button 
                      className="w-full" 
                      size="lg"
                      disabled
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Phone not available
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    size="lg"
                    onClick={() => setShowScheduleModal(true)}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Viewing
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    size="lg"
                    onClick={() => setShowContactModal(true)}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                </div>

                <Separator className="my-6" />

                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-real-estate-gray mb-2">
                    <User className="h-4 w-4" />
                    <span className="text-sm">Listed by {landlordProfile?.full_name || 'Landlord'}</span>
                  </div>
                  
                  {landlordProfile?.phone && (
                    <div className="flex items-center justify-center gap-2 text-real-estate-gray mb-2">
                      <Phone className="h-4 w-4" />
                      <span className="text-sm">{maskPhoneNumber(landlordProfile.phone)}</span>
                      {!user && (
                        <span className="text-xs text-real-estate-blue ml-1">(Sign in to view full number)</span>
                      )}
                    </div>
                  )}
                  
                  <p className="text-xs text-real-estate-gray">
                    Property ID: {property.id.substring(0, 8)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      <ContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        propertyId={property.id}
        propertyTitle={property.title}
        landlordId={property.user_id}
      />

      {/* Schedule Viewing Modal */}
      <ScheduleViewingModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        propertyId={property.id}
        propertyTitle={property.title}
        landlordId={property.user_id}
      />
    </div>
  );
};

export default PropertyDetails;