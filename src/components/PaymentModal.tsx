import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, CreditCard } from "lucide-react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  propertyTitle: string;
  onPaymentSuccess: () => void;
}

const PaymentModal = ({ 
  isOpen, 
  onClose, 
  propertyId, 
  propertyTitle, 
  onPaymentSuccess 
}: PaymentModalProps) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to make a payment.",
        variant: "destructive",
      });
      return;
    }

    if (!phoneNumber.trim()) {
      toast({
        title: "Phone Number Required",
        description: "Please enter your M-Pesa phone number.",
        variant: "destructive",
      });
      return;
    }

    // Validate phone number format
    const cleanPhone = phoneNumber.replace(/\D/g, "");
    if (!cleanPhone.match(/^(254|0)?[7][0-9]{8}$/)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid Kenyan phone number (e.g., 0712345678).",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke("mpesa-payment", {
        body: {
          propertyId,
          amount: 50, // KES 50 for contact access
          phoneNumber: phoneNumber.trim(),
        },
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        toast({
          title: "Payment Initiated",
          description: data.message || "Please check your phone for the M-Pesa prompt.",
        });
        
        // Poll for payment status
        pollPaymentStatus(data.paymentId);
      } else {
        throw new Error(data.error || "Payment initiation failed");
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const pollPaymentStatus = async (paymentId: string) => {
    const maxAttempts = 60; // Poll for up to 5 minutes
    let attempts = 0;

    const checkStatus = async () => {
      attempts++;
      
      try {
        const { data, error } = await supabase
          .from("contact_payments")
          .select("payment_status")
          .eq("id", paymentId)
          .single();

        if (error) {
          console.error("Status check error:", error);
          return;
        }

        if (data.payment_status === "completed") {
          toast({
            title: "Payment Successful",
            description: "You can now access the landlord's contact information.",
          });
          onPaymentSuccess();
          onClose();
          setPhoneNumber("");
          return;
        } else if (data.payment_status === "failed") {
          toast({
            title: "Payment Failed",
            description: "Your payment was not successful. Please try again.",
            variant: "destructive",
          });
          return;
        } else if (attempts < maxAttempts) {
          // Continue polling
          setTimeout(checkStatus, 5000); // Check every 5 seconds
        } else {
          toast({
            title: "Payment Timeout",
            description: "Payment verification timed out. Please check your payment status or try again.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Status polling error:", error);
      }
    };

    setTimeout(checkStatus, 3000); // Start checking after 3 seconds
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Pay to Access Contact
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center py-4 border rounded-lg bg-muted/50">
            <h3 className="font-semibold text-lg">KES 50</h3>
            <p className="text-sm text-muted-foreground">
              One-time payment to access landlord contact for:
            </p>
            <p className="font-medium mt-1">{propertyTitle}</p>
          </div>
          
          <form onSubmit={handlePayment} className="space-y-4">
            <div>
              <Label htmlFor="phone">M-Pesa Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="0712345678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                disabled={isProcessing}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter your M-Pesa registered phone number
              </p>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose} 
                className="flex-1"
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isProcessing} 
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Pay KES 50"
                )}
              </Button>
            </div>
          </form>
          
          <div className="text-xs text-muted-foreground text-center">
            <p>• Secure payment via Safaricom M-Pesa</p>
            <p>• You will receive an STK push on your phone</p>
            <p>• Contact access is instant after payment</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;