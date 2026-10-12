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

    // Find the payment record in either contact_payments or listing_payments
    let table: "contact_payments" | "listing_payments" = "contact_payments";
    let { data: payment, error: findError } = await supabaseService
      .from("contact_payments")
      .select("*")
      .eq("checkout_request_id", CheckoutRequestID)
      .maybeSingle();

    if (!payment) {
      const { data: listingPayment, error: listingErr } = await supabaseService
        .from("listing_payments")
        .select("*")
        .eq("checkout_request_id", CheckoutRequestID)
        .maybeSingle();
      payment = listingPayment;
      findError = listingErr;
      table = "listing_payments";
    }

    if (!payment) {
      console.error("Payment record not found:", findError);
      return new Response("Payment record not found", { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (ResultCode === 0) {
      updateData.payment_status = "completed";
      if (stkCallback.CallbackMetadata?.Item) {
        const metadata = stkCallback.CallbackMetadata.Item;
        const transactionId = metadata.find(
          (item) => item.Name === "MpesaReceiptNumber"
        )?.Value;
        if (transactionId) updateData.transaction_id = transactionId;
      }
      console.log(`Payment completed (${table}) for:`, CheckoutRequestID);
    } else {
      updateData.payment_status = "failed";
      console.log(`Payment failed (${table}) for:`, CheckoutRequestID, ResultDesc);
    }

    const { error: updateError } = await supabaseService
      .from(table)
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