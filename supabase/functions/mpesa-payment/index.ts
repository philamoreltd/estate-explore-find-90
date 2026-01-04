import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MpesaAuthResponse {
  access_token: string;
  expires_in: string;
}

interface PaymentRequest {
  propertyId: string;
  amount: number;
  phoneNumber: string;
}

interface STKPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user) {
      throw new Error("User not authenticated");
    }

    const { propertyId, amount, phoneNumber }: PaymentRequest = await req.json();

    if (!propertyId || !amount || !phoneNumber) {
      throw new Error("Missing required fields: propertyId, amount, phoneNumber");
    }

    // Validate phone number format (Kenyan format)
    const cleanPhone = phoneNumber.replace(/\D/g, "");
    if (!cleanPhone.match(/^(254|0)?[7][0-9]{8}$/)) {
      throw new Error("Invalid phone number format. Use format: 0712345678");
    }

    // Format phone number for M-Pesa (254XXXXXXXXX)
    const formattedPhone = cleanPhone.startsWith("254") 
      ? cleanPhone 
      : "254" + cleanPhone.substring(1);

    console.log("Processing M-Pesa payment for user:", user.id, "property:", propertyId);

    // Get M-Pesa access token
    const consumerKey = Deno.env.get("MPESA_CONSUMER_KEY");
    const consumerSecret = Deno.env.get("MPESA_CONSUMER_SECRET");
    
    if (!consumerKey || !consumerSecret) {
      console.error("M-Pesa credentials not configured");
      throw new Error("M-Pesa credentials are not configured. Please contact support.");
    }

    console.log("Attempting M-Pesa auth with key length:", consumerKey.length);
    
    const auth = btoa(`${consumerKey}:${consumerSecret}`);
    
    const authResponse = await fetch("https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials", {
      method: "GET",
      headers: {
        "Authorization": `Basic ${auth}`,
      },
    });

    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      console.error("M-Pesa auth failed:", authResponse.status, errorText);
      throw new Error(`M-Pesa authentication failed. Please verify API credentials are correct.`);
    }

    const authData: MpesaAuthResponse = await authResponse.json();
    console.log("M-Pesa auth successful, token received");

    // Create payment record in database
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { data: paymentRecord, error: paymentError } = await supabaseService
      .from("contact_payments")
      .insert({
        user_id: user.id,
        property_id: propertyId,
        amount: amount * 100, // Convert to cents
        phone_number: formattedPhone,
        payment_status: "pending",
      })
      .select()
      .single();

    if (paymentError) {
      console.error("Payment record creation failed:", paymentError);
      throw new Error("Failed to create payment record");
    }

    // Initiate STK Push
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
    const shortcode = Deno.env.get("MPESA_SHORTCODE") ?? ""; // Till Number
    const passkey = Deno.env.get("MPESA_PASSKEY") ?? "";
    
    // For Buy Goods (Till), we use the Till Number for both BusinessShortCode and PartyB
    // The passkey should be the one provided by Safaricom for your Till
    if (!shortcode || !passkey) {
      console.error("M-Pesa shortcode or passkey not configured");
      throw new Error("M-Pesa payment configuration incomplete. Please contact support.");
    }
    
    const password = btoa(`${shortcode}${passkey}${timestamp}`);

    console.log("Using shortcode:", shortcode, "for STK Push");

    const stkPushPayload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerBuyGoodsOnline",
      Amount: amount,
      PartyA: formattedPhone,
      PartyB: shortcode, // For Till, PartyB is the same as BusinessShortCode
      PhoneNumber: formattedPhone,
      CallBackURL: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mpesa-callback`,
      AccountReference: paymentRecord.id.substring(0, 12), // Shorten to 12 chars max
      TransactionDesc: "Contact Access",
    };

    const stkResponse = await fetch("https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${authData.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(stkPushPayload),
    });

    const stkData: STKPushResponse = await stkResponse.json();
    console.log("STK Push response:", stkData);

    if (stkData.ResponseCode === "0") {
      // Update payment record with checkout request ID
      await supabaseService
        .from("contact_payments")
        .update({
          checkout_request_id: stkData.CheckoutRequestID,
        })
        .eq("id", paymentRecord.id);

      return new Response(
        JSON.stringify({
          success: true,
          message: stkData.CustomerMessage,
          checkoutRequestId: stkData.CheckoutRequestID,
          paymentId: paymentRecord.id,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else {
      // Update payment status to failed
      await supabaseService
        .from("contact_payments")
        .update({ payment_status: "failed" })
        .eq("id", paymentRecord.id);

      throw new Error(stkData.ResponseDescription || "STK Push failed");
    }
  } catch (error) {
    console.error("Payment error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});