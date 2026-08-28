import Navigation from "@/components/Navigation";
import BottomNavigation from "@/components/BottomNavigation";
import ShopFooter from "@/components/ShopFooter";
import ContactSeller from "@/components/ContactSeller";
import SEO from "@/components/SEO";
import { Card } from "@/components/ui/card";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { useShopSettings } from "@/hooks/useShopSettings";

const Contact = () => {
  const { settings } = useShopSettings();

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <SEO
        title={`Contact ${settings.shop_name} | Laptops in Kenya`}
        description="Talk to our team about laptops, spare parts and accessories. Call or WhatsApp us for prices, availability and delivery across Kenya."
        path="/contact"
      />
      <Navigation />

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold sm:text-3xl">Contact {settings.shop_name}</h1>
        <p className="mt-2 text-muted-foreground">
          Send us the model you need and your budget — we will confirm availability
          and the best price straight away.
        </p>

        <ContactSeller className="mt-6" size="lg" />

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card className="p-5">
            <Phone className="mb-2 h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="text-sm font-semibold">Phone & WhatsApp</h2>
            <p className="mt-1 text-sm text-muted-foreground">{settings.phone_number}</p>
          </Card>
          {settings.email && (
            <Card className="p-5">
              <Mail className="mb-2 h-5 w-5 text-primary" aria-hidden="true" />
              <h2 className="text-sm font-semibold">Email</h2>
              <p className="mt-1 text-sm text-muted-foreground">{settings.email}</p>
            </Card>
          )}
          {settings.address && (
            <Card className="p-5">
              <MapPin className="mb-2 h-5 w-5 text-primary" aria-hidden="true" />
              <h2 className="text-sm font-semibold">Shop location</h2>
              <p className="mt-1 text-sm text-muted-foreground">{settings.address}</p>
            </Card>
          )}
          {settings.opening_hours && (
            <Card className="p-5">
              <Clock className="mb-2 h-5 w-5 text-primary" aria-hidden="true" />
              <h2 className="text-sm font-semibold">Opening hours</h2>
              <p className="mt-1 text-sm text-muted-foreground">{settings.opening_hours}</p>
            </Card>
          )}
        </div>
      </main>

      <ShopFooter />
      <BottomNavigation />
    </div>
  );
};

export default Contact;
