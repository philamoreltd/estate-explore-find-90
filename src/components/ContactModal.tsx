import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  propertyTitle: string;
  landlordId: string;
  hasPaidForContact: boolean;
  onPaymentRequired: () => void;
}

const ContactModal = ({ isOpen, onClose, propertyId, propertyTitle, landlordId, hasPaidForContact, onPaymentRequired }: ContactModalProps) => {
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to contact the landlord.",
        variant: "destructive",
      });
      return;
    }

    if (!hasPaidForContact) {
      toast({
        title: "Payment Required",
        description: "Please pay to access contact information before sending a message.",
        variant: "destructive",
      });
      onPaymentRequired();
      return;
    }

    if (!message.trim()) {
      toast({
        title: "Message Required",
        description: "Please enter a message.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Here you would typically send an email or create a message record
      // For now, we'll just show a success message
      toast({
        title: "Message Sent",
        description: "Your message has been sent to the landlord. They will contact you soon.",
      });
      
      setMessage("");
      setPhone("");
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Contact Landlord</DialogTitle>
        </DialogHeader>

        {!hasPaidForContact ? (
          <div className="space-y-4 text-center">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-800 font-medium mb-2">Payment Required</p>
              <p className="text-amber-700 text-sm">
                To protect landlord contact information and prevent spam, you need to pay KES 50 to access messaging features.
              </p>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="button" onClick={onPaymentRequired} className="flex-1">
                Pay KES 50 to Contact
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="property">Property</Label>
            <Input 
              id="property"
              value={propertyTitle}
              disabled
              className="bg-muted"
            />
          </div>
          
          <div>
            <Label htmlFor="phone">Your Phone Number (Optional)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="0712345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              placeholder="Hi, I'm interested in this property. Could you provide more details?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              required
            />
          </div>
          
            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? "Sending..." : "Send Message"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ContactModal;