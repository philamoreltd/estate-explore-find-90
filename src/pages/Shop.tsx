import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import BottomNavigation from "@/components/BottomNavigation";
import ShopFooter from "@/components/ShopFooter";
import ProductCard from "@/components/ProductCard";
import SEO from "@/components/SEO";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { BRANDS, CATEGORIES, CONDITIONS, Product } from "@/lib/shop";

const ACCESSORY_CATEGORIES: string[] = CATEGORIES.filter(
  (c) => c.value !== "laptops"
).map((c) => c.value);

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get("category") ?? "all";
  const condition = searchParams.get("condition") ?? "all";
  const [brand, setBrand] = useState("all");
  const [sort, setSort] = useState("newest");
  const [search, setSearch] = useState("");

  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === "all") next.delete(key);
    else next.set(key, value);
    setSearchParams(next, { replace: true });
  };

  const filtered = useMemo(() => {
    let list = [...(products ?? [])];

    if (category === "accessories") {
      list = list.filter((p) => ACCESSORY_CATEGORIES.includes(p.category));
    } else if (category !== "all") {
      list = list.filter((p) => p.category === category);
    }

    if (condition !== "all") list = list.filter((p) => p.condition === condition);
    if (brand !== "all") list = list.filter((p) => p.brand === brand);

    const term = search.trim().toLowerCase();
    if (term) {
      list = list.filter((p) =>
        [p.name, p.brand, p.processor, p.ram, p.storage, p.description]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(term))
      );
    }

    switch (sort) {
      case "price-asc":
        list.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case "price-desc":
        list.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case "name":
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        list.sort(
          (a, b) =>
            Number(b.featured) - Number(a.featured) ||
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }

    return list;
  }, [products, category, condition, brand, search, sort]);

  const heading =
    category === "all"
      ? "All laptops & accessories"
      : category === "accessories"
      ? "Laptop accessories & spares"
      : CATEGORIES.find((c) => c.value === category)?.label ?? "Products";

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <SEO
        title={`${heading} in Kenya | Laptop Hub Kenya`}
        description="Browse laptops, chargers, batteries, RAM, SSDs, bags and other computer accessories available in Kenya with prices in KES."
        path="/shop"
      />
      <Navigation />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold sm:text-3xl">{heading}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {filtered.length} item{filtered.length === 1 ? "" : "s"} available
        </p>

        <Card className="mt-6 grid grid-cols-1 gap-4 p-4 md:grid-cols-5">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search e.g. HP i5 8GB"
              className="pl-9"
              aria-label="Search products"
            />
          </div>

          <Select value={category} onValueChange={(v) => setParam("category", v)}>
            <SelectTrigger aria-label="Category"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              <SelectItem value="accessories">All accessories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={condition} onValueChange={(v) => setParam("condition", v)}>
            <SelectTrigger aria-label="Condition"><SelectValue placeholder="Condition" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any condition</SelectItem>
              {CONDITIONS.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={brand} onValueChange={setBrand}>
            <SelectTrigger aria-label="Brand"><SelectValue placeholder="Brand" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All brands</SelectItem>
              {BRANDS.map((b) => (
                <SelectItem key={b} value={b}>{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="md:col-span-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="sm:w-56" aria-label="Sort by">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="price-asc">Price: low to high</SelectItem>
                <SelectItem value="price-desc">Price: high to low</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchParams(new URLSearchParams(), { replace: true });
                setBrand("all");
                setSearch("");
                setSort("newest");
              }}
            >
              Clear filters
            </Button>
          </div>
        </Card>

        <div className="mt-8">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-80 w-full" />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <Card className="p-10 text-center text-muted-foreground">
              No products match your filters. Try clearing them or ask us on WhatsApp.
            </Card>
          )}
        </div>
      </main>

      <ShopFooter />
      <BottomNavigation />
    </div>
  );
};

export default Shop;
