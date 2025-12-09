import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Bed, Bath, Square, Calendar, User, Phone, Mail, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Navigation from "@/components/Navigation";
import ContactModal from "@/components/ContactModal";
import ScheduleViewingModal from "@/components/ScheduleViewingModal";
import PaymentModal from "@/components/PaymentModal";
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
  image_urls: string[] | null;
  status: string;
  created_at: string;
  user_id: string;
  phone: string | null;
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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [hasPaidForContact, setHasPaidForContact] = useState(false);
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
        .rpc('get_properties_with_conditional_phone')
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

      // Check if user has paid for contact access
      if (user) {
        await checkPaymentStatus(propertyId);
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

  const checkPaymentStatus = async (propertyId: string) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('contact_payments')
        .select('payment_status')
        .eq('user_id', user.id)
        .eq('property_id', propertyId)
        .eq('payment_status', 'completed')
        .maybeSingle();

      if (!error && data) {
        setHasPaidForContact(true);
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
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
        // If no profile exists, try to get basic info from the property owner
        try {
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();
          
          if (userData) {
            setLandlordProfile(userData);
          } else {
            // Set a default profile with no phone
            setLandlordProfile({
              full_name: 'Property Owner',
              phone: null,
              email: null
            });
          }
        } catch (fallbackError) {
          console.error('Fallback profile fetch failed:', fallbackError);
          setLandlordProfile({
            full_name: 'Property Owner',
            phone: null,
            email: null
          });
        }
        return;
      }

      console.log('Landlord profile data:', data);
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

        {/* Property Images Carousel */}
        <div className="aspect-video w-full mb-8 rounded-lg overflow-hidden relative group">
          {(() => {
            const images = property.image_urls && property.image_urls.length > 0 
              ? property.image_urls 
              : property.image_url 
                ? [property.image_url] 
                : [];
            
            if (images.length === 0) {
              return (
                <div className="w-full h-full bg-real-estate-gray/10 flex items-center justify-center">
                  <span className="text-real-estate-gray text-lg">No Image Available</span>
                </div>
              );
            }

            const nextImage = () => {
              setCurrentImageIndex((prev) => (prev + 1) % images.length);
            };

            const prevImage = () => {
              setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
            };

            return (
              <>
                <img
                  src={images[currentImageIndex]}
                  alt={`${property.title} - Image ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover"
                />
                
                {images.length > 1 && (
                  <>
                    {/* Previous Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                    
                    {/* Next Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      onClick={nextImage}
                    >
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                    
                    {/* Image Counter */}
                    <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                      {currentImageIndex + 1} / {images.length}
                    </div>
                    
                    {/* Dot Indicators */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {images.map((_, index) => (
                        <button
                          key={index}
                          className={`w-3 h-3 rounded-full transition-colors ${
                            index === currentImageIndex 
                              ? 'bg-white' 
                              : 'bg-white/50 hover:bg-white/75'
                          }`}
                          onClick={() => setCurrentImageIndex(index)}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            );
          })()}
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
                  {!user ? (
                    <Button 
                      className="w-full" 
                      size="lg"
                      variant="outline"
                      onClick={() => navigate('/auth')}
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Sign in to view contact
                    </Button>
                  ) : !hasPaidForContact ? (
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={() => setShowPaymentModal(true)}
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Pay KES 100 to view contact
                    </Button>
                  ) : property.phone ? (
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={() => window.open(`tel:${property.phone}`, '_self')}
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Call {property.phone}
                    </Button>
                  ) : (
                    <Button 
                      className="w-full" 
                      size="lg"
                      disabled
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Phone not provided
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
                    onClick={() => user ? setShowContactModal(true) : navigate('/auth')}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    {user ? "Send Message" : "Sign in to Message"}
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
                      <span className="text-sm">
                        {user ? (hasPaidForContact ? landlordProfile.phone : "Pay to reveal") : "Sign in to access"}
                      </span>
                      {!user && (
                        <span className="text-xs text-real-estate-blue ml-1">(Sign in required)</span>
                      )}
                      {user && !hasPaidForContact && (
                        <span className="text-xs text-real-estate-blue ml-1">(KES 50 to unlock)</span>
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
        hasPaidForContact={hasPaidForContact}
        onPaymentRequired={() => {
          setShowContactModal(false);
          setShowPaymentModal(true);
        }}
      />

      {/* Schedule Viewing Modal */}
      <ScheduleViewingModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        propertyId={property.id}
        propertyTitle={property.title}
        landlordId={property.user_id}
      />

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        propertyId={property.id}
        propertyTitle={property.title}
        onPaymentSuccess={() => {
          setHasPaidForContact(true);
          setShowPaymentModal(false);
        }}
      />
    </div>
  );
};

export default PropertyDetails;