export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  condition: string;
  price: number;
  original_price: number | null;
  processor: string | null;
  ram: string | null;
  storage: string | null;
  screen_size: string | null;
  graphics: string | null;
  operating_system: string | null;
  description: string | null;
  image_url: string | null;
  image_urls: string[] | null;
  stock_status: string;
  featured: boolean;
  warranty_months: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const CATEGORIES = [
  { value: "laptops", label: "Laptops" },
  { value: "chargers", label: "Chargers & Adapters" },
  { value: "batteries", label: "Batteries" },
  { value: "bags", label: "Bags & Sleeves" },
  { value: "storage", label: "Storage (SSD/HDD)" },
  { value: "memory", label: "RAM & Memory" },
  { value: "keyboards-mice", label: "Keyboards & Mice" },
  { value: "screens", label: "Screens & Displays" },
  { value: "docking", label: "Docks & Hubs" },
  { value: "cooling", label: "Cooling & Stands" },
  { value: "other", label: "Other Accessories" },
] as const;

export const BRANDS = [
  "HP",
  "Dell",
  "Lenovo",
  "Apple",
  "Asus",
  "Acer",
  "MSI",
  "Microsoft",
  "Toshiba",
  "Samsung",
  "Anker",
  "Logitech",
  "Other",
] as const;

export const CONDITIONS = [
  { value: "new", label: "Brand New" },
  { value: "refurbished", label: "Refurbished" },
  { value: "used", label: "Used (Ex-UK)" },
] as const;

export const STOCK_STATUSES = [
  { value: "in_stock", label: "In stock" },
  { value: "low_stock", label: "Few left" },
  { value: "out_of_stock", label: "Out of stock" },
  { value: "pre_order", label: "Pre-order" },
] as const;

export const categoryLabel = (value: string) =>
  CATEGORIES.find((c) => c.value === value)?.label ?? value;

export const conditionLabel = (value: string) =>
  CONDITIONS.find((c) => c.value === value)?.label ?? value;

export const stockLabel = (value: string) =>
  STOCK_STATUSES.find((s) => s.value === value)?.label ?? value;

export const formatKES = (amount: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(amount);

export const productImage = (product: Pick<Product, "image_url" | "image_urls">) =>
  product.image_url || product.image_urls?.[0] || "/placeholder.svg";

export const productImages = (product: Pick<Product, "image_url" | "image_urls">) => {
  const list = [
    ...(product.image_url ? [product.image_url] : []),
    ...(product.image_urls ?? []),
  ];
  const unique = Array.from(new Set(list));
  return unique.length > 0 ? unique : ["/placeholder.svg"];
};

export const whatsappLink = (number: string, message: string) =>
  `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;

export const enquiryMessage = (product?: Product) =>
  product
    ? `Hi, I'm interested in the ${product.name} (${formatKES(product.price)}) listed on Laptop Hub Kenya. Is it available?`
    : "Hi, I'd like to enquire about laptops and accessories at Laptop Hub Kenya.";
