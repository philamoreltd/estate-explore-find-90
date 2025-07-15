import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Home, DollarSign, Users, Upload } from "lucide-react";
import Navigation from "@/components/Navigation";

const Tenants = () => {
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
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="title">Property Title</Label>
                <Input 
                  id="title"
                  placeholder="e.g., Modern 2BR Apartment in Kilimani"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="type">Property Type</Label>
                <select 
                  id="type"
                  className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="">Select Property Type</option>
                  <option value="bedsitters">Bedsitters</option>
                  <option value="single-rooms">Single Rooms</option>
                  <option value="one-bedrooms">One Bedrooms</option>
                  <option value="two-bedrooms">Two Bedrooms</option>
                  <option value="three-bedrooms">Three Bedrooms</option>
                  <option value="apartments">Apartments</option>
                  <option value="business-rooms">Business Rooms</option>
                  <option value="offices">Offices</option>
                  <option value="lodgings">Lodgings</option>
                  <option value="bnb">BNB</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="rent">Monthly Rent (Ksh)</Label>
                <div className="relative mt-1">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="rent"
                    type="number"
                    placeholder="85000"
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="location">Location</Label>
                <div className="relative mt-1">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="location"
                    placeholder="e.g., Kilimani, Nairobi"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Input 
                  id="bedrooms"
                  type="number"
                  placeholder="2"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="bathrooms">Bathrooms</Label>
                <Input 
                  id="bathrooms"
                  type="number"
                  placeholder="1"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="sqft">Size (sq ft)</Label>
                <Input 
                  id="sqft"
                  type="number"
                  placeholder="1200"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description"
                placeholder="Describe your property, amenities, and what makes it special..."
                className="mt-1 min-h-24"
              />
            </div>

            <div>
              <Label htmlFor="images">Property Images</Label>
              <div className="mt-1 border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Drag and drop images here, or click to select files
                </p>
                <Button variant="outline" className="mt-2">
                  Upload Images
                </Button>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button variant="hero" size="lg" className="flex-1">
                <Users className="h-4 w-4 mr-2" />
                List Property
              </Button>
              <Button variant="outline" size="lg">
                Save as Draft
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Tenants;