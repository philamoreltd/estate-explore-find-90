import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import BottomNavigation from "@/components/BottomNavigation";
import SEO from "@/components/SEO";
import ProductFormDialog from "@/components/admin/ProductFormDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import {
  Product,
  categoryLabel,
  conditionLabel,
  formatKES,
  productImage,
  stockLabel,
} from "@/lib/shop";
import { useShopSettings } from "@/hooks/useShopSettings";

const AdminDashboard = () => {
  const { isAdmin, isLoading: checkingAdmin } = useIsAdmin();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { settings } = useShopSettings();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState<Record<string, string> | null>(null);

  const { data: products, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["featured-products"] });
  };

  const handleDelete = async () => {
    if (!deleting) return;
    const { error } = await supabase.from("products").delete().eq("id", deleting.id);
    if (error) {
      toast({ title: "Could not delete", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Product deleted", description: `${deleting.name} was removed.` });
      refresh();
    }
    setDeleting(null);
  };

  const form = settingsForm ?? {
    shop_name: settings.shop_name,
    whatsapp_number: settings.whatsapp_number,
    phone_number: settings.phone_number,
    email: settings.email ?? "",
    address: settings.address ?? "",
    opening_hours: settings.opening_hours ?? "",
  };

  const saveSettings = async () => {
    if (!settings.id) return;
    setSavingSettings(true);
    const { error } = await supabase
      .from("shop_settings")
      .update({
        shop_name: form.shop_name,
        whatsapp_number: form.whatsapp_number,
        phone_number: form.phone_number,
        email: form.email || null,
        address: form.address || null,
        opening_hours: form.opening_hours || null,
      })
      .eq("id", settings.id);
    setSavingSettings(false);

    if (error) {
      toast({ title: "Could not save", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Shop details saved" });
    queryClient.invalidateQueries({ queryKey: ["shop-settings"] });
  };

  if (checkingAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="mx-auto max-w-6xl px-4 py-10">
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background pb-16 md:pb-0">
        <SEO title="Admin | Laptop Hub Kenya" description="Shop administration." path="/admin" noindex />
        <Navigation />
        <main className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold">Admins only</h1>
          <p className="mt-2 text-muted-foreground">
            This area is for shop staff. If you are a customer, browse our stock instead.
          </p>
          <Button asChild className="mt-6">
            <Link to="/shop">Go to shop</Link>
          </Button>
        </main>
        <BottomNavigation />
      </div>
    );
  }

  const outOfStock = (products ?? []).filter((p) => p.stock_status === "out_of_stock").length;

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <SEO title="Admin | Laptop Hub Kenya" description="Manage shop stock." path="/admin" noindex />
      <Navigation />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">Shop admin</h1>
            <p className="text-sm text-muted-foreground">
              Manage laptops, accessories and shop contact details.
            </p>
          </div>
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add product
          </Button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Total products</CardTitle></CardHeader>
            <CardContent className="text-2xl font-bold">{products?.length ?? 0}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Featured</CardTitle></CardHeader>
            <CardContent className="text-2xl font-bold">
              {(products ?? []).filter((p) => p.featured).length}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Laptops</CardTitle></CardHeader>
            <CardContent className="text-2xl font-bold">
              {(products ?? []).filter((p) => p.category === "laptops").length}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Out of stock</CardTitle></CardHeader>
            <CardContent className="text-2xl font-bold">{outOfStock}</CardContent>
          </Card>
        </div>

        <Tabs defaultValue="products" className="mt-8">
          <TabsList>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="settings">Shop details</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="mt-6">
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (products ?? []).length === 0 ? (
              <Card className="p-10 text-center text-muted-foreground">
                No products yet. Use “Add product” to list your first laptop.
              </Card>
            ) : (
              <div className="space-y-3">
                {(products ?? []).map((product) => (
                  <Card key={product.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                    <img
                      src={productImage(product)}
                      alt={product.name}
                      loading="lazy"
                      className="h-20 w-28 shrink-0 rounded object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate font-semibold">{product.name}</h2>
                      <p className="text-xs text-muted-foreground">
                        {product.brand} · {categoryLabel(product.category)} ·{" "}
                        {conditionLabel(product.condition)}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-primary">
                          {formatKES(Number(product.price))}
                        </span>
                        <Badge variant="outline">{stockLabel(product.stock_status)}</Badge>
                        {product.featured && <Badge>Featured</Badge>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditing(product);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="mr-1 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleting(product)}
                        aria-label={`Delete ${product.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <Card className="max-w-2xl p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Shop name</Label>
                  <Input
                    value={form.shop_name}
                    onChange={(e) => setSettingsForm({ ...form, shop_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp number (254...)</Label>
                  <Input
                    value={form.whatsapp_number}
                    onChange={(e) => setSettingsForm({ ...form, whatsapp_number: e.target.value })}
                    placeholder="254712345678"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone number</Label>
                  <Input
                    value={form.phone_number}
                    onChange={(e) => setSettingsForm({ ...form, phone_number: e.target.value })}
                    placeholder="+254 712 345 678"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    value={form.email}
                    onChange={(e) => setSettingsForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Shop address</Label>
                  <Input
                    value={form.address}
                    onChange={(e) => setSettingsForm({ ...form, address: e.target.value })}
                    placeholder="Moi Avenue, Nairobi CBD"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Opening hours</Label>
                  <Input
                    value={form.opening_hours}
                    onChange={(e) => setSettingsForm({ ...form, opening_hours: e.target.value })}
                    placeholder="Mon-Sat: 8:30am - 6:00pm"
                  />
                </div>
              </div>
              <Button className="mt-6" onClick={saveSettings} disabled={savingSettings}>
                {savingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save shop details
              </Button>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <ProductFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editing}
        onSaved={refresh}
      />

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.name} will be permanently removed from the shop.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNavigation />
    </div>
  );
};

export default AdminDashboard;
