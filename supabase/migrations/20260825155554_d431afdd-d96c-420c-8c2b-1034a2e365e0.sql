CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  brand text NOT NULL DEFAULT 'Other',
  category text NOT NULL DEFAULT 'laptops',
  condition text NOT NULL DEFAULT 'new',
  price numeric NOT NULL,
  original_price numeric,
  processor text,
  ram text,
  storage text,
  screen_size text,
  graphics text,
  operating_system text,
  description text,
  image_url text,
  image_urls text[] DEFAULT '{}'::text[],
  stock_status text NOT NULL DEFAULT 'in_stock',
  featured boolean NOT NULL DEFAULT false,
  warranty_months integer,
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view products"
  ON public.products FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert products"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update products"
  ON public.products FOR UPDATE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can delete products"
  ON public.products FOR DELETE
  TO authenticated
  USING (public.is_admin());

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX products_category_idx ON public.products (category);
CREATE INDEX products_brand_idx ON public.products (brand);

CREATE TABLE public.shop_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_name text NOT NULL DEFAULT 'Housevilla Laptops',
  whatsapp_number text NOT NULL DEFAULT '254700000000',
  phone_number text NOT NULL DEFAULT '+254 700 000 000',
  email text,
  address text,
  opening_hours text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.shop_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_settings TO authenticated;
GRANT ALL ON public.shop_settings TO service_role;

ALTER TABLE public.shop_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view shop settings"
  ON public.shop_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage shop settings"
  ON public.shop_settings FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TRIGGER update_shop_settings_updated_at
  BEFORE UPDATE ON public.shop_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.shop_settings (shop_name, whatsapp_number, phone_number, email, address, opening_hours)
VALUES ('Laptop Hub Kenya', '254700000000', '+254 700 000 000', 'sales@laptophub.co.ke', 'Nairobi CBD, Kenya', 'Mon-Sat: 8:30am - 6:00pm');