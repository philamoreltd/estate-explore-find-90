import { Home, Search, PlusCircle, Building2, User, LogIn, ArrowLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const handleBack = () => {
    navigate(-1);
  };

  const navItems = [
    { label: "Back", icon: ArrowLeft, path: "back", onClick: handleBack },
    { label: "Home", icon: Home, path: "/" },
    { label: "Browse", icon: Search, path: "/browse" },
    { label: "Add", icon: PlusCircle, path: "/add-property" },
    { 
      label: user ? "Account" : "Sign In", 
      icon: user ? User : LogIn, 
      path: user ? "/admin" : "/auth" 
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <button
              key={item.path}
              onClick={() => item.onClick ? item.onClick() : navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full px-2 transition-colors",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5 mb-1", isActive && "text-primary")} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
