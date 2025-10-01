import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Home, Eye, Edit, Trash2, MapPin, Bed, Bath } from "lucide-react";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

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
}

const Landlords = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserProperties();
    }
  }, [user]);

  const fetchUserProperties = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .rpc('get_properties_with_conditional_phone')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching properties:', error);
        toast({
          title: "Error",
          description: "Failed to load your properties. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setProperties(data || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return;

    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete property. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Property deleted successfully.",
      });

      // Remove from local state
      setProperties(prev => prev.filter(p => p.id !== propertyId));
    } catch (error) {
      console.error('Error deleting property:', error);
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'rented': return 'bg-blue-100 text-blue-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-real-estate-navy mb-2">
              My Properties
            </h1>
            <p className="text-real-estate-gray">
              Manage your rental property listings
            </p>
          </div>
          <Button onClick={() => navigate('/add-property')} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add New Property
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-real-estate-gray">Total Properties</p>
                  <p className="text-2xl font-bold text-real-estate-navy">{properties.length}</p>
                </div>
                <Home className="h-8 w-8 text-real-estate-blue" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-real-estate-gray">Available</p>
                  <p className="text-2xl font-bold text-green-600">
                    {properties.filter(p => p.status === 'available').length}
                  </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <div className="h-3 w-3 rounded-full bg-green-600"></div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-real-estate-gray">Rented</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {properties.filter(p => p.status === 'rented').length}
                  </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <div className="h-3 w-3 rounded-full bg-blue-600"></div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-real-estate-gray">Total Revenue</p>
                  <p className="text-2xl font-bold text-real-estate-blue">
                    {formatPrice(properties.filter(p => p.status === 'rented').reduce((sum, p) => sum + p.rent_amount, 0))}
                  </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-real-estate-blue/10 flex items-center justify-center">
                  <span className="text-real-estate-blue font-bold">KES</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Properties List */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-video bg-gray-200"></div>
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-4 w-2/3"></div>
                  <div className="h-6 bg-gray-200 rounded mb-2 w-1/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Home className="h-12 w-12 text-real-estate-gray mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-real-estate-navy mb-2">
                No Properties Listed Yet
              </h3>
              <p className="text-real-estate-gray mb-6">
                Start by adding your first rental property to attract potential tenants.
              </p>
              <Button onClick={() => navigate('/add-property')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Property
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <Card key={property.id} className="overflow-hidden">
                <div className="aspect-video bg-gray-100 relative">
                  {property.image_url ? (
                    <img
                      src={property.image_url}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-real-estate-gray/10">
                      <Home className="h-8 w-8 text-real-estate-gray" />
                    </div>
                  )}
                  <Badge className={`absolute top-2 left-2 ${getStatusColor(property.status)}`}>
                    {property.status}
                  </Badge>
                </div>
                
                <CardContent className="p-6">
                  <h3 className="font-semibold text-real-estate-navy mb-2 line-clamp-2">
                    {property.title}
                  </h3>
                  
                  <div className="flex items-center gap-1 text-real-estate-gray mb-3">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{property.location}</span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-real-estate-gray mb-4">
                    <div className="flex items-center gap-1">
                      <Bed className="h-4 w-4" />
                      <span>{property.bedrooms}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Bath className="h-4 w-4" />
                      <span>{property.bathrooms}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xl font-bold text-real-estate-blue">
                      {formatPrice(property.rent_amount)}/month
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => navigate(`/property/${property.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => navigate(`/edit-property/${property.id}`)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleDeleteProperty(property.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Landlords;