import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

interface CallbackData {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{
          Name: string;
          Value: any;
        }>;
      };
    };
  };
}

serve(async (req) => {
  try {
    const callbackData: CallbackData = await req.json();
    
    console.log("M-Pesa callback received:", JSON.stringify(callbackData, null, 2));

    const { stkCallback } = callbackData.Body;
    const { CheckoutRequestID, ResultCode, ResultDesc } = stkCallback;

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Find the payment record
    const { data: payment, error: findError } = await supabaseService
      .from("contact_payments")
      .select("*")
      .eq("checkout_request_id", CheckoutRequestID)
      .single();

    if (findError || !payment) {
      console.error("Payment record not found:", findError);
      return new Response("Payment record not found", { status: 404 });
    }

    let updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (ResultCode === 0) {
      // Payment successful
      updateData.payment_status = "completed";
      
      // Extract transaction details from callback metadata
      if (stkCallback.CallbackMetadata?.Item) {
        const metadata = stkCallback.CallbackMetadata.Item;
        const transactionId = metadata.find(item => item.Name === "MpesaReceiptNumber")?.Value;
        
        if (transactionId) {
          updateData.transaction_id = transactionId;
        }
      }
      
      console.log("Payment completed successfully for checkout:", CheckoutRequestID);
    } else {
      // Payment failed or cancelled
      updateData.payment_status = "failed";
      console.log("Payment failed for checkout:", CheckoutRequestID, "Reason:", ResultDesc);
    }

    // Update payment record
    const { error: updateError } = await supabaseService
      .from("contact_payments")
      .update(updateData)
      .eq("id", payment.id);

    if (updateError) {
      console.error("Failed to update payment record:", updateError);
      return new Response("Failed to update payment record", { status: 500 });
    }

    console.log("Payment record updated successfully");

    return new Response(JSON.stringify({ status: "success" }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Callback processing error:", error);
    return new Response("Callback processing failed", { status: 500 });
  }
});