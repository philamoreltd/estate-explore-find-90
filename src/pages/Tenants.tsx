import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Home, DollarSign, Users, Upload, AlertCircle } from "lucide-react";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Tenants = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    property_type: "",
    rent_amount: "",
    location: "",
    bedrooms: "",
    bathrooms: "",
    size_sqft: "",
    description: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.title.trim()) {
      newErrors.title = "Property title is required";
    }
    
    if (!formData.property_type) {
      newErrors.property_type = "Property type is required";
    }
    
    if (!formData.rent_amount || isNaN(Number(formData.rent_amount)) || Number(formData.rent_amount) <= 0) {
      newErrors.rent_amount = "Please enter a valid rent amount";
    }
    
    if (!formData.location.trim()) {
      newErrors.location = "Location is required";
    }
    
    if (!formData.bedrooms || isNaN(Number(formData.bedrooms)) || Number(formData.bedrooms) < 0) {
      newErrors.bedrooms = "Please enter a valid number of bedrooms";
    }
    
    if (!formData.bathrooms || isNaN(Number(formData.bathrooms)) || Number(formData.bathrooms) < 0) {
      newErrors.bathrooms = "Please enter a valid number of bathrooms";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const propertyData = {
        user_id: user?.id,
        title: formData.title,
        property_type: formData.property_type,
        rent_amount: Number(formData.rent_amount),
        location: formData.location,
        bedrooms: Number(formData.bedrooms),
        bathrooms: Number(formData.bathrooms),
        size_sqft: formData.size_sqft ? Number(formData.size_sqft) : null,
        description: formData.description || null,
        status: 'available'
      };

      const { error } = await supabase
        .from('properties')
        .insert([propertyData]);

      if (error) {
        console.error('Error creating property:', error);
        toast({
          title: "Error",
          description: "Failed to create property. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success!",
        description: "Your property has been listed successfully.",
      });
      
      // Reset form
      setFormData({
        title: "",
        property_type: "",
        rent_amount: "",
        location: "",
        bedrooms: "",
        bathrooms: "",
        size_sqft: "",
        description: "",
      });
      
    } catch (error) {
      console.error('Error creating property:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-real-estate-navy mb-2">
            Add New Property
          </h1>
          <p className="text-real-estate-gray">
            List your rental property and connect with potential tenants
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Property Details
            </CardTitle>
            <CardDescription>
              Fill out the information below to list your property
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="title">Property Title</Label>
                  <Input 
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g., Modern 2BR Apartment in Kilimani"
                    className="mt-1"
                    disabled={isLoading}
                  />
                  {errors.title && (
                    <p className="text-sm text-destructive mt-1">{errors.title}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="property_type">Property Type</Label>
                  <select 
                    id="property_type"
                    name="property_type"
                    value={formData.property_type}
                    onChange={handleInputChange}
                    className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background"
                    disabled={isLoading}
                  >
                    <option value="">Select property type</option>
                    <option value="bedsitter">Bedsitter</option>
                    <option value="single-room">Single Room</option>
                    <option value="one-bedroom">One Bedroom</option>
                    <option value="two-bedroom">Two Bedroom</option>
                    <option value="three-bedroom">Three Bedroom</option>
                    <option value="apartment">Apartment</option>
                    <option value="business-room">Business Room</option>
                    <option value="office">Office</option>
                    <option value="lodging">Lodging</option>
                    <option value="bnb">BNB</option>
                  </select>
                  {errors.property_type && (
                    <p className="text-sm text-destructive mt-1">{errors.property_type}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="rent_amount">Monthly Rent (KES)</Label>
                  <div className="relative mt-1">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-real-estate-gray" />
                    <Input 
                      id="rent_amount"
                      name="rent_amount"
                      type="number"
                      value={formData.rent_amount}
                      onChange={handleInputChange}
                      placeholder="25,000"
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                  {errors.rent_amount && (
                    <p className="text-sm text-destructive mt-1">{errors.rent_amount}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="location">Location</Label>
                  <div className="relative mt-1">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-real-estate-gray" />
                    <Input 
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="e.g., Kilimani, Nairobi"
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                  {errors.location && (
                    <p className="text-sm text-destructive mt-1">{errors.location}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Input 
                    id="bedrooms"
                    name="bedrooms"
                    type="number"
                    value={formData.bedrooms}
                    onChange={handleInputChange}
                    placeholder="2"
                    className="mt-1"
                    disabled={isLoading}
                  />
                  {errors.bedrooms && (
                    <p className="text-sm text-destructive mt-1">{errors.bedrooms}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Input 
                    id="bathrooms"
                    name="bathrooms"
                    type="number"
                    value={formData.bathrooms}
                    onChange={handleInputChange}
                    placeholder="2"
                    className="mt-1"
                    disabled={isLoading}
                  />
                  {errors.bathrooms && (
                    <p className="text-sm text-destructive mt-1">{errors.bathrooms}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="size_sqft">Size (sq ft)</Label>
                  <Input 
                    id="size_sqft"
                    name="size_sqft"
                    type="number"
                    value={formData.size_sqft}
                    onChange={handleInputChange}
                    placeholder="1200"
                    className="mt-1"
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Property Description</Label>
                <Textarea 
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your property, amenities, and any special features..."
                  className="mt-1 min-h-[100px]"
                  disabled={isLoading}
                />
              </div>
              
              <div>
                <Label htmlFor="images">Property Images</Label>
                <div className="mt-1 border-2 border-dashed border-real-estate-gray/30 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 text-real-estate-gray mx-auto mb-2" />
                  <p className="text-real-estate-gray">
                    Click to upload images or drag and drop
                  </p>
                  <p className="text-sm text-real-estate-gray/80 mt-1">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4 pt-6">
                <Button 
                  type="submit" 
                  size="lg" 
                  className="flex-1"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating Property..." : "List Property"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="lg" 
                  className="flex-1"
                  disabled={isLoading}
                >
                  Save as Draft
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Tenants;