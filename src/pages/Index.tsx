import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import BottomNavigation from "@/components/BottomNavigation";
import ShopFooter from "@/components/ShopFooter";
import ProductCard from "@/components/ProductCard";
import ContactSeller from "@/components/ContactSeller";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BadgeCheck,
  Cable,
  Laptop,
  ShieldCheck,
  Truck,
  Wrench,
} from "lucide-react";
import { CATEGORIES, Product } from "@/lib/shop";
import heroImage from "@/assets/hero-laptops.jpg";

const highlights = [
  { icon: BadgeCheck, title: "Genuine stock", text: "Tested laptops, original chargers and parts." },
  { icon: ShieldCheck, title: "Warranty", text: "Up to 12 months warranty on selected machines." },
  { icon: Truck, title: "Countrywide delivery", text: "Same-day in Nairobi, courier upcountry." },
  { icon: Wrench, title: "Free advice", text: "We help you pick the right spec for your budget." },
];

const Index = () => {
  const { data: featured, isLoading } = useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("featured", { ascending: false })
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <SEO
        title="Laptop Hub Kenya — Laptops & Accessories in Nairobi"
        description="Buy brand new, refurbished and ex-UK laptops, chargers, batteries, bags and accessories in Kenya. Best prices in Nairobi with warranty and countrywide delivery."
        path="/"
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "Store",
            name: "Laptop Hub Kenya",
            url: "https://housevilla.co.ke/",
            areaServed: "KE",
            currenciesAccepted: "KES",
            description:
              "Laptops, spare parts and accessories shop serving Nairobi and the rest of Kenya.",
          },
        ]}
      />
      <Navigation />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <img
            src={heroImage}
            alt="Laptops and accessories on display"
            width={1600}
            height={1000}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-real-estate-navy/80" />
          <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
            <div className="max-w-2xl text-white">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent">
                Nairobi · Kenya
              </p>
              <h1 className="text-3xl font-bold leading-tight sm:text-5xl">
                Laptops & accessories at honest Kenyan prices
              </h1>
              <p className="mt-4 text-base text-white/85 sm:text-lg">
                Brand new, refurbished and ex-UK laptops, plus chargers, batteries,
                RAM, SSDs, bags and everything in between. Order on WhatsApp and we
                deliver countrywide.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link to="/shop?category=laptops">
                    <Laptop className="mr-2 h-5 w-5" />
                    Shop laptops
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="bg-white/10 text-white hover:bg-white/20">
                  <Link to="/shop?category=accessories">
                    <Cable className="mr-2 h-5 w-5" />
                    Shop accessories
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Highlights */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {highlights.map((item) => (
              <Card key={item.title} className="p-5">
                <item.icon className="mb-3 h-6 w-6 text-primary" aria-hidden="true" />
                <h3 className="text-sm font-semibold">{item.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{item.text}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Categories */}
        <section className="bg-muted/50 py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="mb-6 text-2xl font-bold">Shop by category</h2>
            <div className="flex flex-wrap gap-3">
              {CATEGORIES.map((category) => (
                <Button key={category.value} asChild variant="outline" size="sm">
                  <Link to={`/shop?category=${category.value}`}>{category.label}</Link>
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Featured products */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">Featured stock</h2>
              <p className="text-sm text-muted-foreground">
                Fresh arrivals and best sellers this week.
              </p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/shop">View all</Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-80 w-full" />
              ))}
            </div>
          ) : featured && featured.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center text-muted-foreground">
              No products yet. Stock will appear here once the shop adds it.
            </Card>
          )}
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <Card className="p-8 text-center">
            <h2 className="text-2xl font-bold">Not sure what to buy?</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
              Tell us your budget and what you use your laptop for, and we will
              recommend the best options in stock.
            </p>
            <ContactSeller className="mx-auto mt-6 max-w-lg" size="lg" />
          </Card>
        </section>
      </main>

      <ShopFooter />
      <BottomNavigation />
    </div>
  );
};

export default Index;
