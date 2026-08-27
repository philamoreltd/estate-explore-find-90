import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ShopSettings {
  id: string;
  shop_name: string;
  whatsapp_number: string;
  phone_number: string;
  email: string | null;
  address: string | null;
  opening_hours: string | null;
}

const FALLBACK: ShopSettings = {
  id: "",
  shop_name: "Laptop Hub Kenya",
  whatsapp_number: "254700000000",
  phone_number: "+254 700 000 000",
  email: "sales@laptophub.co.ke",
  address: "Nairobi CBD, Kenya",
  opening_hours: "Mon-Sat: 8:30am - 6:00pm",
};

export const useShopSettings = () => {
  const query = useQuery({
    queryKey: ["shop-settings"],
    queryFn: async (): Promise<ShopSettings> => {
      const { data, error } = await supabase
        .from("shop_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as ShopSettings) ?? FALLBACK;
    },
  });

  return { settings: query.data ?? FALLBACK, isLoading: query.isLoading };
};
