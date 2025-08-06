import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Home, DollarSign, Users, Upload, AlertCircle, X } from "lucide-react";
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
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const newFiles = [...selectedImages, ...files].slice(0, 5); // Max 5 images
      setSelectedImages(newFiles);
      
      // Create previews for new files
      const newPreviews: string[] = [];
      files.forEach((file, index) => {
        if (selectedImages.length + index < 5) {
          const reader = new FileReader();
          reader.onloadend = () => {
            newPreviews.push(reader.result as string);
            if (newPreviews.length === Math.min(files.length, 5 - selectedImages.length)) {
              setImagePreviews(prev => [...prev, ...newPreviews]);
            }
          };
          reader.readAsDataURL(file);
        }
      });
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (files: File[], propertyId: string): Promise<string[]> => {
    const uploadPromises = files.map(async (file, index) => {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user?.id}/${propertyId}_${index}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('property-images')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          return null;
        }

        const { data } = supabase.storage
          .from('property-images')
          .getPublicUrl(fileName);

        return data.publicUrl;
      } catch (error) {
        console.error('Error uploading image:', error);
        return null;
      }
    });

    const results = await Promise.all(uploadPromises);
    return results.filter((url): url is string => url !== null);
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
      // First create the property
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

      const { data: property, error } = await supabase
        .from('properties')
        .insert([propertyData])
        .select()
        .single();

      if (error) {
        console.error('Error creating property:', error);
        toast({
          title: "Error",
          description: "Failed to create property. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Upload images if selected
      if (selectedImages.length > 0 && property) {
        const imageUrls = await uploadImages(selectedImages, property.id);
        
        if (imageUrls.length > 0) {
          // Update property with image URLs
          const { error: updateError } = await supabase
            .from('properties')
            .update({ 
              image_urls: imageUrls,
              image_url: imageUrls[0] // Keep first image as primary for backward compatibility
            })
            .eq('id', property.id);

          if (updateError) {
            console.error('Error updating property with images:', updateError);
          }
        }
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
      setSelectedImages([]);
      setImagePreviews([]);
      
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
                  <Label htmlFor="rent_amount">Monthly Rent (KSH)</Label>
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
                <div className="mt-1">
                  <input
                    type="file"
                    id="images"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                    disabled={isLoading}
                  />
                  
                  {/* Image Previews */}
                  {imagePreviews.length > 0 && (
                    <div className="mb-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {imagePreviews.map((preview, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={preview}
                              alt={`Property preview ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg border border-real-estate-gray/20"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              disabled={isLoading}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {imagePreviews.length}/5 images selected
                      </p>
                    </div>
                  )}
                  
                  {/* Upload Area */}
                  <label
                    htmlFor="images"
                    className={`border-2 border-dashed border-real-estate-gray/30 rounded-lg p-6 text-center block cursor-pointer hover:border-real-estate-gray/50 transition-colors ${
                      selectedImages.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <Upload className="h-8 w-8 text-real-estate-gray mx-auto mb-2" />
                    <p className="text-real-estate-gray">
                      {selectedImages.length >= 5 
                        ? 'Maximum 5 images reached' 
                        : 'Click to upload images or drag and drop'
                      }
                    </p>
                    <p className="text-sm text-real-estate-gray/80 mt-1">
                      PNG, JPG, GIF up to 10MB (Max 5 images)
                    </p>
                  </label>
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