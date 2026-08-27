import { Home, Laptop, Cable, MessageCircle, User, LogIn } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useShopSettings } from "@/hooks/useShopSettings";
import { enquiryMessage, whatsappLink } from "@/lib/shop";
import { cn } from "@/lib/utils";

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { settings } = useShopSettings();

  const navItems = [
    { label: "Home", icon: Home, path: "/" },
    { label: "Laptops", icon: Laptop, path: "/shop?category=laptops" },
    { label: "Parts", icon: Cable, path: "/shop?category=accessories" },
    {
      label: "WhatsApp",
      icon: MessageCircle,
      path: "whatsapp",
      onClick: () =>
        window.open(
          whatsappLink(settings.whatsapp_number, enquiryMessage()),
          "_blank",
          "noopener,noreferrer"
        ),
    },
    {
      label: user ? "Account" : "Sign In",
      icon: user ? User : LogIn,
      path: user ? "/admin" : "/auth",
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background md:hidden">
      <div className="flex h-16 items-center justify-around">
        {navItems.map((item) => {
          const isActive = location.pathname + location.search === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => (item.onClick ? item.onClick() : navigate(item.path))}
              className={cn(
                "flex h-full flex-1 flex-col items-center justify-center px-2 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="mb-1 h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
