import { Link } from "react-router-dom";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { useShopSettings } from "@/hooks/useShopSettings";

const ShopFooter = () => {
  const { settings } = useShopSettings();

  return (
    <footer className="bg-real-estate-navy py-12 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <h3 className="mb-4 text-lg font-semibold">{settings.shop_name}</h3>
            <p className="text-sm text-white/80">
              Genuine laptops, spare parts and accessories in Kenya. Brand new,
              refurbished and ex-UK machines with warranty and countrywide delivery.
            </p>
          </div>

          <div>
            <h4 className="mb-4 font-semibold">Shop</h4>
            <ul className="space-y-2 text-sm text-white/80">
              <li><Link to="/shop?category=laptops" className="hover:text-accent">Laptops</Link></li>
              <li><Link to="/shop?category=chargers" className="hover:text-accent">Chargers</Link></li>
              <li><Link to="/shop?category=bags" className="hover:text-accent">Bags & Sleeves</Link></li>
              <li><Link to="/shop" className="hover:text-accent">All Products</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold">Support</h4>
            <ul className="space-y-2 text-sm text-white/80">
              <li><Link to="/contact" className="hover:text-accent">Contact Us</Link></li>
              <li><Link to="/shop?condition=refurbished" className="hover:text-accent">Refurbished Deals</Link></li>
              <li><Link to="/auth" className="hover:text-accent">Staff Sign In</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold">Reach us</h4>
            <ul className="space-y-2 text-sm text-white/80">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" aria-hidden="true" />
                {settings.phone_number}
              </li>
              {settings.email && (
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  {settings.email}
                </li>
              )}
              {settings.address && (
                <li className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                  {settings.address}
                </li>
              )}
              {settings.opening_hours && (
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  {settings.opening_hours}
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-white/20 pt-8 text-center text-sm text-white/80">
          <p>&copy; {new Date().getFullYear()} {settings.shop_name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default ShopFooter;
