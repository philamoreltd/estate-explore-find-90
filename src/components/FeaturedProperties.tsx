import PropertyCard from "./PropertyCard";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import property1 from "@/assets/property-1.jpg";
import property2 from "@/assets/property-2.jpg";
import property3 from "@/assets/property-3.jpg";

const FeaturedProperties = () => {
  const properties = [
    {
      id: 1,
      image: property1,
      price: "Ksh 85,000/month",
      address: "Kilimani Estate",
      city: "Nairobi",
      beds: 4,
      baths: 3,
      sqft: 2400,
      type: "For Rent",
      isNew: true
    },
    {
      id: 2,
      image: property2,
      price: "Ksh 55,000/month",
      address: "Lavington Heights",
      city: "Nairobi",
      beds: 3,
      baths: 2,
      sqft: 1850,
      type: "For Rent",
      isNew: false
    },
    {
      id: 3,
      image: property3,
      price: "Ksh 120,000/month",
      address: "Karen Gardens",
      city: "Nairobi",
      beds: 5,
      baths: 4,
      sqft: 3200,
      type: "For Rent",
      isNew: true
    }
  ];

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
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              image={property.image}
              price={property.price}
              address={property.address}
              city={property.city}
              beds={property.beds}
              baths={property.baths}
              sqft={property.sqft}
              type={property.type}
              isNew={property.isNew}
            />
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Button variant="hero" size="lg">
            View All Rentals
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProperties;