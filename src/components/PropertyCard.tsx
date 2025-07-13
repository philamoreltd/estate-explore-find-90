import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Bed, Bath, Square, MapPin } from "lucide-react";

interface PropertyCardProps {
  image: string;
  price: string;
  address: string;
  city: string;
  beds: number;
  baths: number;
  sqft: number;
  type: string;
  isNew?: boolean;
}

const PropertyCard = ({ 
  image, 
  price, 
  address, 
  city, 
  beds, 
  baths, 
  sqft, 
  type, 
  isNew = false 
}: PropertyCardProps) => {
  return (
    <div className="bg-white rounded-xl shadow-card hover:shadow-hover transition-all duration-300 hover:-translate-y-1 overflow-hidden group">
      {/* Image */}
      <div className="relative overflow-hidden">
        <img 
          src={image} 
          alt={address}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Badges and Actions */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
          <div className="flex gap-2">
            {isNew && <Badge className="bg-real-estate-green text-white">New</Badge>}
            <Badge className="bg-real-estate-blue text-white">{type}</Badge>
          </div>
          <Button variant="ghost" size="icon" className="bg-white/80 hover:bg-white">
            <Heart className="h-4 w-4 text-real-estate-gray hover:text-red-500 transition-colors" />
          </Button>
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-card opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-2xl font-bold text-real-estate-navy">{price}</h3>
          <div className="text-sm text-real-estate-gray">
            ${Math.round(parseInt(price.replace(/[$,]/g, '')) / sqft)}/sqft
          </div>
        </div>

        <div className="flex items-center text-real-estate-gray mb-3">
          <MapPin className="h-4 w-4 mr-1" />
          <span className="text-sm">
            {address}, {city}
          </span>
        </div>

        {/* Property Details */}
        <div className="flex items-center gap-4 mb-4 text-real-estate-gray">
          <div className="flex items-center">
            <Bed className="h-4 w-4 mr-1" />
            <span className="text-sm">{beds} bed{beds !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center">
            <Bath className="h-4 w-4 mr-1" />
            <span className="text-sm">{baths} bath{baths !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center">
            <Square className="h-4 w-4 mr-1" />
            <span className="text-sm">{sqft.toLocaleString()} sqft</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-3 border-t border-real-estate-gray/10">
          <Button variant="outline" size="sm" className="flex-1">
            View Details
          </Button>
          <Button variant="gold" size="sm" className="flex-1">
            Schedule Tour
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;