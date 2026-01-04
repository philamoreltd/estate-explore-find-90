import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Plus, Upload, X } from "lucide-react";

interface UserOption {
  user_id: string;
  full_name: string;
  email: string;
}

interface AddPropertyDialogProps {
  landlords: UserOption[];
  onSuccess: () => void;
}

export const AddPropertyDialog = ({ landlords, onSuccess }: AddPropertyDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    owner_id: "",
    title: "",
    property_type: "",
    location: "",
    phone: "",
    rent_amount: "",
    bedrooms: "1",
    bathrooms: "1",
    size_sqft: "",
    description: "",
    status: "available",
  });

  const logActivity = async (action: string, entityType: string, entityId?: string, details?: Record<string, string>) => {
    if (!user) return;
    try {
      await supabase.from('activity_logs').insert([{
        staff_id: user.id,
        action_type: action,
        entity_type: entityType,
        entity_id: entityId || null,
        details: details as any || null,
      }]);
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setImageFiles(prev => [...prev, ...files]);
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = () => {
          setImagePreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const uploadImages = async (userId: string): Promise<string[]> => {
    if (imageFiles.length === 0) return [];
    const uploadedUrls: string[] = [];

    for (const file of imageFiles) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        continue;
      }

      const { data } = supabase.storage
        .from('property-images')
        .getPublicUrl(fileName);

      uploadedUrls.push(data.publicUrl);
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.owner_id) {
      toast({
        title: "Error",
        description: "Please select a landlord for this property.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const imageUrls = await uploadImages(formData.owner_id);

      const propertyData = {
        user_id: formData.owner_id,
        title: formData.title,
        property_type: formData.property_type,
        location: formData.location,
        phone: formData.phone,
        rent_amount: Number(formData.rent_amount),
        bedrooms: Number(formData.bedrooms),
        bathrooms: Number(formData.bathrooms),
        size_sqft: formData.size_sqft ? Number(formData.size_sqft) : null,
        description: formData.description || null,
        status: formData.status,
        image_url: imageUrls[0] || null,
        image_urls: imageUrls.length > 0 ? imageUrls : null,
      };

      const { data, error } = await supabase
        .from('properties')
        .insert(propertyData)
        .select()
        .single();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to create property. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Log the activity
      await logActivity(
        'created_property',
        'property',
        data.id,
        { title: formData.title, location: formData.location, owner_id: formData.owner_id }
      );

      toast({
        title: "Success",
        description: "Property created successfully.",
      });

      // Reset form
      setFormData({
        owner_id: "",
        title: "",
        property_type: "",
        location: "",
        phone: "",
        rent_amount: "",
        bedrooms: "1",
        bathrooms: "1",
        size_sqft: "",
        description: "",
        status: "available",
      });
      setImageFiles([]);
      setImagePreviews([]);
      setOpen(false);
      onSuccess();
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1">
          <Plus className="h-4 w-4" />
          Add Property
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Property</DialogTitle>
          <DialogDescription>
            Create a new property listing. Assign it to a landlord.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Assign to Landlord *</Label>
            <Select value={formData.owner_id} onValueChange={(v) => setFormData({ ...formData, owner_id: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select landlord" />
              </SelectTrigger>
              <SelectContent>
                {landlords.map((landlord) => (
                  <SelectItem key={landlord.user_id} value={landlord.user_id}>
                    {landlord.full_name || landlord.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Property Images</Label>
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mb-2">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-16 object-cover rounded" />
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 opacity-0 group-hover:opacity-100"
                      onClick={() => {
                        setImagePreviews(prev => prev.filter((_, i) => i !== index));
                        setImageFiles(prev => prev.filter((_, i) => i !== index));
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div>
              <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" id="property-image-upload" />
              <label htmlFor="property-image-upload" className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border rounded cursor-pointer hover:bg-muted">
                <Upload className="h-4 w-4" />
                Upload Images
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Title *</Label>
              <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., Beautiful 2BR Apartment" required />
            </div>
            <div className="space-y-2">
              <Label>Property Type *</Label>
              <Select value={formData.property_type} onValueChange={(v) => setFormData({ ...formData, property_type: v })}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="house">House</SelectItem>
                  <SelectItem value="condo">Condo</SelectItem>
                  <SelectItem value="studio">Studio</SelectItem>
                  <SelectItem value="room">Room</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="rented">Rented</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Rent (KES) *</Label>
              <Input type="number" value={formData.rent_amount} onChange={(e) => setFormData({ ...formData, rent_amount: e.target.value })} placeholder="50000" required />
            </div>
            <div className="space-y-2">
              <Label>Phone *</Label>
              <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+254..." required />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Location *</Label>
              <Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="e.g., Nairobi, Kenya" required />
            </div>
            <div className="space-y-2">
              <Label>Bedrooms</Label>
              <Input type="number" value={formData.bedrooms} onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Bathrooms</Label>
              <Input type="number" value={formData.bathrooms} onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Size (sqft)</Label>
              <Input type="number" value={formData.size_sqft} onChange={(e) => setFormData({ ...formData, size_sqft: e.target.value })} placeholder="Optional" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Describe the property..." />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Property
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
