import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import BottomNavigation from "@/components/BottomNavigation";
import ShopFooter from "@/components/ShopFooter";
import ContactSeller from "@/components/ContactSeller";
import ProductCard from "@/components/ProductCard";
import SEO from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import {
  Product,
  categoryLabel,
  conditionLabel,
  formatKES,
  productImages,
  stockLabel,
} from "@/lib/shop";

const ProductDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [activeImage, setActiveImage] = useState(0);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as Product | null;
    },
  });

  const { data: related } = useQuery({
    queryKey: ["related-products", product?.category, product?.id],
    enabled: !!product,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("category", product!.category)
        .neq("id", product!.id)
        .limit(4);
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-16 md:pb-0">
        <Navigation />
        <main className="mx-auto max-w-6xl px-4 py-10">
          <Skeleton className="h-96 w-full" />
        </main>
        <BottomNavigation />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background pb-16 md:pb-0">
        <Navigation />
        <main className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold">Product not found</h1>
          <p className="mt-2 text-muted-foreground">
            This item may have been sold or removed.
          </p>
          <Button asChild className="mt-6">
            <Link to="/shop">Back to shop</Link>
          </Button>
        </main>
        <BottomNavigation />
      </div>
    );
  }

  const images = productImages(product);
  const specs = [
    ["Brand", product.brand],
    ["Category", categoryLabel(product.category)],
    ["Condition", conditionLabel(product.condition)],
    ["Processor", product.processor],
    ["RAM", product.ram],
    ["Storage", product.storage],
    ["Screen", product.screen_size],
    ["Graphics", product.graphics],
    ["Operating system", product.operating_system],
    ["Warranty", product.warranty_months ? `${product.warranty_months} months` : null],
  ].filter(([, value]) => !!value) as [string, string][];

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <SEO
        title={`${product.name} price in Kenya | Laptop Hub Kenya`}
        description={
          product.description?.slice(0, 155) ||
          `${product.name} available in Kenya at ${formatKES(Number(product.price))}. ${conditionLabel(product.condition)}.`
        }
        path={`/product/${product.id}`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          brand: { "@type": "Brand", name: product.brand },
          description: product.description ?? undefined,
          image: images,
          offers: {
            "@type": "Offer",
            price: Number(product.price),
            priceCurrency: "KES",
            availability:
              product.stock_status === "out_of_stock"
                ? "https://schema.org/OutOfStock"
                : "https://schema.org/InStock",
          },
        }}
      />
      <Navigation />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/shop">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to shop
          </Link>
        </Button>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div>
            <div className="aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted">
              <img
                src={images[activeImage]}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {images.map((image, index) => (
                  <button
                    key={image}
                    onClick={() => setActiveImage(index)}
                    aria-label={`View image ${index + 1}`}
                    className={`h-16 w-20 shrink-0 overflow-hidden rounded border ${
                      index === activeImage ? "border-primary" : "border-border"
                    }`}
                  >
                    <img src={image} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{conditionLabel(product.condition)}</Badge>
              <Badge variant="outline">{stockLabel(product.stock_status)}</Badge>
              {product.featured && <Badge>Featured</Badge>}
            </div>

            <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{product.name}</h1>

            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-3xl font-bold text-primary">
                {formatKES(Number(product.price))}
              </span>
              {product.original_price && Number(product.original_price) > Number(product.price) && (
                <span className="text-lg text-muted-foreground line-through">
                  {formatKES(Number(product.original_price))}
                </span>
              )}
            </div>

            {product.warranty_months ? (
              <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
                {product.warranty_months} months warranty included
              </p>
            ) : null}

            <ContactSeller product={product} className="mt-6" size="lg" />

            {product.description && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold">Description</h2>
                <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                  {product.description}
                </p>
              </div>
            )}

            <div className="mt-8">
              <h2 className="text-lg font-semibold">Specifications</h2>
              <Card className="mt-2 divide-y divide-border">
                {specs.map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4 px-4 py-2.5 text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium text-right">{value}</span>
                  </div>
                ))}
              </Card>
            </div>
          </div>
        </div>

        {related && related.length > 0 && (
          <section className="mt-14">
            <h2 className="mb-5 text-xl font-bold">Similar products</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        )}
      </main>

      <ShopFooter />
      <BottomNavigation />
    </div>
  );
};

export default ProductDetails;
