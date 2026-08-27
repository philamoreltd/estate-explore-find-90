import { Button } from "@/components/ui/button";
import { MessageCircle, Phone } from "lucide-react";
import { useShopSettings } from "@/hooks/useShopSettings";
import { Product, enquiryMessage, whatsappLink } from "@/lib/shop";

interface ContactSellerProps {
  product?: Product;
  className?: string;
  size?: "sm" | "default" | "lg";
}

const ContactSeller = ({ product, className, size = "default" }: ContactSellerProps) => {
  const { settings } = useShopSettings();

  return (
    <div className={`flex flex-col sm:flex-row gap-3 ${className ?? ""}`}>
      <Button asChild size={size} className="flex-1">
        <a
          href={whatsappLink(settings.whatsapp_number, enquiryMessage(product))}
          target="_blank"
          rel="noopener noreferrer"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Order on WhatsApp
        </a>
      </Button>
      <Button asChild size={size} variant="outline" className="flex-1">
        <a href={`tel:${settings.phone_number.replace(/\s/g, "")}`}>
          <Phone className="h-4 w-4 mr-2" />
          Call {settings.phone_number}
        </a>
      </Button>
    </div>
  );
};

export default ContactSeller;
