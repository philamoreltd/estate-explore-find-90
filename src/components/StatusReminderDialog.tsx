import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Home, AlertTriangle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface StaleProperty {
  id: string;
  title: string;
  location: string;
  rent_amount: number;
  status: string;
  updated_at: string;
}

interface StatusReminderDialogProps {
  userId: string;
  onStatusUpdated?: () => void;
}

const StatusReminderDialog = ({ userId, onStatusUpdated }: StatusReminderDialogProps) => {
  const [open, setOpen] = useState(false);
  const [staleProperties, setStaleProperties] = useState<StaleProperty[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkStaleProperties();
  }, [userId]);

  const checkStaleProperties = async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from("properties")
      .select("id, title, location, rent_amount, status, updated_at")
      .eq("user_id", userId)
      .eq("status", "available")
      .lte("updated_at", thirtyDaysAgo.toISOString());

    if (error) {
      console.error("Error checking stale properties:", error);
      return;
    }

    if (data && data.length > 0) {
      // Check if we've already shown the reminder today
      const lastShown = localStorage.getItem(`status_reminder_${userId}`);
      const today = new Date().toDateString();
      
      if (lastShown === today) return;

      setStaleProperties(data);
      setCurrentIndex(0);
      setOpen(true);
      localStorage.setItem(`status_reminder_${userId}`, today);
    }
  };

  const currentProperty = staleProperties[currentIndex];

  const handleUpdateStatus = async (newStatus: "available" | "occupied") => {
    if (!currentProperty) return;
    setUpdating(true);

    try {
      const { error } = await supabase
        .from("properties")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", currentProperty.id);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `"${currentProperty.title}" marked as ${newStatus}.`,
      });

      if (currentIndex < staleProperties.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setOpen(false);
        onStatusUpdated?.();
      }
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update property status.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleSkip = () => {
    if (currentIndex < staleProperties.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setOpen(false);
    }
  };

  const daysSinceUpdate = currentProperty
    ? Math.floor(
        (Date.now() - new Date(currentProperty.updated_at).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount);

  if (!currentProperty) return null;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="max-w-md mx-auto">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <AlertDialogTitle className="text-lg">
              Property Status Check
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {staleProperties.length > 1
                  ? `${currentIndex + 1} of ${staleProperties.length} properties need your attention.`
                  : "This property hasn't been updated in a while."}
              </p>

              <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <Home className="h-4 w-4 mt-0.5 text-primary" />
                  <span className="font-semibold text-foreground text-sm">
                    {currentProperty.title}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground text-sm">
                  <MapPin className="h-3.5 w-3.5" />
                  {currentProperty.location}
                </div>
                <div className="text-sm font-medium text-primary">
                  {formatPrice(currentProperty.rent_amount)}/month
                </div>
                <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 text-xs">
                  Last updated {daysSinceUpdate} days ago
                </Badge>
              </div>

              <p className="text-sm font-medium text-foreground">
                Is this property still available?
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <div className="flex gap-2 w-full">
            <Button
              className="flex-1"
              onClick={() => handleUpdateStatus("available")}
              disabled={updating}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Still Available
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => handleUpdateStatus("occupied")}
              disabled={updating}
            >
              <Home className="h-4 w-4 mr-1" />
              Now Occupied
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            disabled={updating}
            className="text-muted-foreground"
          >
            {currentIndex < staleProperties.length - 1 ? "Skip this one" : "Remind me later"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default StatusReminderDialog;
