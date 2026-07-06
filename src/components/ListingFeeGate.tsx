import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, CheckCircle2, KeyRound } from "lucide-react";

interface ListingFeeGateProps {
  rentAmount: number;
  phoneNumber: string;
  cleared: { method: "code" | "payment"; reference: string } | null;
  onCleared: (info: { method: "code" | "payment"; reference: string }) => void;
}

const calcFee = (rent: number) => Math.max(10, Math.ceil((rent || 0) * 0.04));

const ListingFeeGate = ({ rentAmount, phoneNumber, cleared, onCleared }: ListingFeeGateProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [pendingPaymentId, setPendingPaymentId] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  // On mount, check if user already has an unused completed payment
  useEffect(() => {
    if (!user || cleared) return;
    (async () => {
      const { data } = await supabase
        .from("listing_payments")
        .select("id, transaction_id")
        .eq("user_id", user.id)
        .eq("payment_status", "completed")
        .eq("consumed", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        onCleared({ method: "payment", reference: data.id });
      }
    })();
  }, [user, cleared, onCleared]);

  // Poll for payment completion
  useEffect(() => {
    if (!pendingPaymentId || cleared) return;
    setIsPolling(true);
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("listing_payments")
        .select("id, payment_status")
        .eq("id", pendingPaymentId)
        .maybeSingle();
      if (data?.payment_status === "completed") {
        clearInterval(interval);
        setIsPolling(false);
        setPendingPaymentId(null);
        onCleared({ method: "payment", reference: data.id });
        toast({ title: "Payment received", description: "You can now submit your listing." });
      } else if (data?.payment_status === "failed") {
        clearInterval(interval);
        setIsPolling(false);
        setPendingPaymentId(null);
        toast({
          title: "Payment failed",
          description: "Please try again or use an admin code.",
          variant: "destructive",
        });
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [pendingPaymentId, cleared, onCleared, toast]);

  const validateCode = async () => {
    const trimmed = code.trim();
    if (!trimmed) return;
    setIsValidating(true);
    try {
      const { data, error } = await supabase.rpc("validate_listing_code", {
        p_code: trimmed,
      });
      if (error) throw error;
      if (data === true) {
        onCleared({ method: "code", reference: trimmed });
        toast({ title: "Code accepted", description: "Listing fee waived." });
      } else {
        toast({
          title: "Invalid code",
          description: "That code is not active.",
          variant: "destructive",
        });
      }
    } catch (e) {
      toast({
        title: "Could not validate code",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const fee = calcFee(rentAmount);

  if (cleared) {
    return (
      <Card className="border-green-500/50 bg-green-500/5">
        <CardContent className="p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <div className="flex-1">
            <p className="text-sm font-medium">
              Listing fee {cleared.method === "code" ? "waived by code" : "paid"}
            </p>
            <p className="text-xs text-muted-foreground">
              {cleared.method === "code"
                ? `Code: ${cleared.reference}`
                : "Your payment is confirmed."}
            </p>
          </div>
          <Badge variant="secondary">Ready</Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span>Listing fee</span>
          <span className="text-primary">${fee.toLocaleString()}</span>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Enter an admin code to publish your listing.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-medium flex items-center gap-1">
            <KeyRound className="h-3 w-3" /> Admin code
          </label>
          <div className="flex gap-2">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter code"
              className="uppercase"
            />
            <Button
              type="button"
              variant="outline"
              onClick={validateCode}
              disabled={isValidating || !code.trim()}
            >
              {isValidating && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Apply
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Don't have a code? Contact an administrator to request one.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ListingFeeGate;
