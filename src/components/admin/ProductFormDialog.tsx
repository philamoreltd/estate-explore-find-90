import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Upload, X } from "lucide-react";
import { BRANDS, CATEGORIES, CONDITIONS, Product, STOCK_STATUSES } from "@/lib/shop";

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  onSaved: () => void;
}

const emptyForm = {
  name: "",
  brand: "HP",
  category: "laptops",
  condition: "new",
  price: "",
  original_price: "",
  processor: "",
  ram: "",
  storage: "",
  screen_size: "",
  graphics: "",
  operating_system: "",
  description: "",
  stock_status: "in_stock",
  warranty_months: "",
  featured: false,
};

const ProductFormDialog = ({
  open,
  onOpenChange,
  product,
  onSaved,
}: ProductFormDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        brand: product.brand,
        category: product.category,
        condition: product.condition,
        price: String(product.price ?? ""),
        original_price: product.original_price ? String(product.original_price) : "",
        processor: product.processor ?? "",
        ram: product.ram ?? "",
        storage: product.storage ?? "",
        screen_size: product.screen_size ?? "",
        graphics: product.graphics ?? "",
        operating_system: product.operating_system ?? "",
        description: product.description ?? "",
        stock_status: product.stock_status,
        warranty_months: product.warranty_months ? String(product.warranty_months) : "",
        featured: product.featured,
      });
      const list = [
        ...(product.image_url ? [product.image_url] : []),
        ...(product.image_urls ?? []),
      ];
      setImages(Array.from(new Set(list)));
    } else {
      setForm(emptyForm);
      setImages([]);
    }
  }, [product, open]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0 || !user) return;
    setIsUploading(true);
    const uploaded: string[] = [];

    for (const file of files) {
      const ext = file.name.split(".").pop();
      const path = `products/${user.id}/${Date.now()}-${Math.random()}.${ext}`;
      const { error } = await supabase.storage
        .from("property-images")
        .upload(path, file);
      if (error) {
        console.error("Upload failed", error);
        continue;
      }
      const { data } = supabase.storage.from("property-images").getPublicUrl(path);
      uploaded.push(data.publicUrl);
    }

    setImages((prev) => [...prev, ...uploaded]);
    setIsUploading(false);
    if (uploaded.length === 0) {
      toast({
        title: "Upload failed",
        description: "Could not upload the selected images.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) {
      toast({
        title: "Missing details",
        description: "Product name and price are required.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    const payload = {
      name: form.name,
      brand: form.brand,
      category: form.category,
      condition: form.condition,
      price: Number(form.price),
      original_price: form.original_price ? Number(form.original_price) : null,
      processor: form.processor || null,
      ram: form.ram || null,
      storage: form.storage || null,
      screen_size: form.screen_size || null,
      graphics: form.graphics || null,
      operating_system: form.operating_system || null,
      description: form.description || null,
      stock_status: form.stock_status,
      warranty_months: form.warranty_months ? Number(form.warranty_months) : null,
      featured: form.featured,
      image_url: images[0] ?? null,
      image_urls: images,
      created_by: user?.id ?? null,
    };

    const { error } = product
      ? await supabase.from("products").update(payload).eq("id", product.id)
      : await supabase.from("products").insert(payload);

    setIsSaving(false);

    if (error) {
      toast({
        title: "Could not save",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: product ? "Product updated" : "Product added",
      description: `${form.name} has been saved.`,
    });
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>{product ? "Edit product" : "Add product"}</DialogTitle>
          <DialogDescription>
            Fill in the details buyers see on the shop page. Prices are in KES.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Images</Label>
            {images.length > 0 && (
              <div className="mb-2 grid grid-cols-4 gap-2">
                {images.map((image, index) => (
                  <div key={image} className="relative">
                    <img src={image} alt="" className="h-16 w-full rounded object-cover" />
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      aria-label="Remove image"
                      className="absolute -right-1 -top-1 h-5 w-5 rounded-full"
                      onClick={() => setImages((prev) => prev.filter((_, i) => i !== index))}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              id="product-images"
              className="hidden"
              onChange={handleUpload}
            />
            <label
              htmlFor="product-images"
              className="inline-flex cursor-pointer items-center gap-2 rounded border px-3 py-1.5 text-sm hover:bg-muted"
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Upload images
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Product name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. HP EliteBook 840 G6 Core i5"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Brand</Label>
              <Select value={form.brand} onValueChange={(v) => setForm({ ...form, brand: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BRANDS.map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Condition</Label>
              <Select value={form.condition} onValueChange={(v) => setForm({ ...form, condition: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONDITIONS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Availability</Label>
              <Select
                value={form.stock_status}
                onValueChange={(v) => setForm({ ...form, stock_status: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STOCK_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Price (KES) *</Label>
              <Input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="45000"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Was price (KES)</Label>
              <Input
                type="number"
                value={form.original_price}
                onChange={(e) => setForm({ ...form, original_price: e.target.value })}
                placeholder="Optional"
              />
            </div>

            <div className="space-y-2">
              <Label>Processor</Label>
              <Input
                value={form.processor}
                onChange={(e) => setForm({ ...form, processor: e.target.value })}
                placeholder="Intel Core i5 8th Gen"
              />
            </div>

            <div className="space-y-2">
              <Label>RAM</Label>
              <Input
                value={form.ram}
                onChange={(e) => setForm({ ...form, ram: e.target.value })}
                placeholder="8GB DDR4"
              />
            </div>

            <div className="space-y-2">
              <Label>Storage</Label>
              <Input
                value={form.storage}
                onChange={(e) => setForm({ ...form, storage: e.target.value })}
                placeholder="256GB SSD"
              />
            </div>

            <div className="space-y-2">
              <Label>Screen size</Label>
              <Input
                value={form.screen_size}
                onChange={(e) => setForm({ ...form, screen_size: e.target.value })}
                placeholder='14" FHD'
              />
            </div>

            <div className="space-y-2">
              <Label>Graphics</Label>
              <Input
                value={form.graphics}
                onChange={(e) => setForm({ ...form, graphics: e.target.value })}
                placeholder="Intel UHD 620"
              />
            </div>

            <div className="space-y-2">
              <Label>Operating system</Label>
              <Input
                value={form.operating_system}
                onChange={(e) => setForm({ ...form, operating_system: e.target.value })}
                placeholder="Windows 11 Pro"
              />
            </div>

            <div className="space-y-2">
              <Label>Warranty (months)</Label>
              <Input
                type="number"
                value={form.warranty_months}
                onChange={(e) => setForm({ ...form, warranty_months: e.target.value })}
                placeholder="6"
              />
            </div>

            <div className="flex items-center justify-between rounded border px-3 py-2">
              <Label htmlFor="featured-switch" className="text-sm">Feature on homepage</Label>
              <Switch
                id="featured-switch"
                checked={form.featured}
                onCheckedChange={(v) => setForm({ ...form, featured: v })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Condition notes, what's included, battery health..."
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {product ? "Save changes" : "Add product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductFormDialog;
