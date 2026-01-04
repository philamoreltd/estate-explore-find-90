import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface ExpiringPayment {
  id: string;
  user_id: string;
  property_id: string;
  expires_at: string;
  user_email: string;
  user_name: string;
  property_title: string;
  property_location: string;
  rent_amount: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting expiry reminder check...");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Find payments expiring in exactly 2 days (between 2 and 3 days from now)
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    const twoDaysStart = new Date(twoDaysFromNow);
    twoDaysStart.setHours(0, 0, 0, 0);
    const twoDaysEnd = new Date(twoDaysFromNow);
    twoDaysEnd.setHours(23, 59, 59, 999);

    console.log(`Checking for payments expiring between ${twoDaysStart.toISOString()} and ${twoDaysEnd.toISOString()}`);

    // Get expiring payments with user and property details
    const { data: expiringPayments, error: paymentsError } = await supabase
      .from("contact_payments")
      .select(`
        id,
        user_id,
        property_id,
        expires_at,
        amount
      `)
      .eq("payment_status", "completed")
      .gte("expires_at", twoDaysStart.toISOString())
      .lte("expires_at", twoDaysEnd.toISOString());

    if (paymentsError) {
      console.error("Error fetching expiring payments:", paymentsError);
      throw paymentsError;
    }

    console.log(`Found ${expiringPayments?.length || 0} expiring payments`);

    if (!expiringPayments || expiringPayments.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No expiring payments found", remindersSent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let remindersSent = 0;
    const errors: string[] = [];

    for (const payment of expiringPayments) {
      try {
        // Get user profile for email
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("user_id", payment.user_id)
          .maybeSingle();

        if (profileError || !profile?.email) {
          console.log(`No email found for user ${payment.user_id}, skipping`);
          continue;
        }

        // Get property details
        const { data: property, error: propertyError } = await supabase
          .from("properties")
          .select("title, location, rent_amount")
          .eq("id", payment.property_id)
          .maybeSingle();

        if (propertyError || !property) {
          console.log(`Property not found for payment ${payment.id}, skipping`);
          continue;
        }

        const expiryDate = new Date(payment.expires_at);
        const formattedDate = expiryDate.toLocaleDateString("en-KE", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        const renewalFee = Math.max(Math.ceil(Number(property.rent_amount) * 0.06), 10);

        console.log(`Sending reminder to ${profile.email} for property: ${property.title}`);

        const emailResponse = await resend.emails.send({
          from: "Pata Keja <notifications@resend.dev>",
          to: [profile.email],
          subject: `Your contact access expires in 2 days - ${property.title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #333; font-size: 24px;">Contact Access Expiring Soon</h1>
              
              <p style="color: #666; font-size: 16px;">
                Hi ${profile.full_name || "there"},
              </p>
              
              <p style="color: #666; font-size: 16px;">
                Your access to the landlord's contact information for the following property will expire on <strong>${formattedDate}</strong>:
              </p>
              
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h2 style="color: #333; font-size: 18px; margin: 0 0 10px 0;">${property.title}</h2>
                <p style="color: #666; margin: 5px 0;">📍 ${property.location}</p>
                <p style="color: #666; margin: 5px 0;">💰 KES ${Number(property.rent_amount).toLocaleString()} /month</p>
              </div>
              
              <p style="color: #666; font-size: 16px;">
                To continue accessing the landlord's contact details, you can renew your access for just <strong>KES ${renewalFee.toLocaleString()}</strong>.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovable.app')}/property/${payment.property_id}" 
                   style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Renew Access Now
                </a>
              </div>
              
              <p style="color: #999; font-size: 14px; border-top: 1px solid #eee; padding-top: 20px;">
                If you no longer need access to this property, you can safely ignore this email.
              </p>
              
              <p style="color: #999; font-size: 14px;">
                Best regards,<br>
                The Pata Keja Team
              </p>
            </div>
          `,
        });

        console.log("Email sent successfully:", emailResponse);
        remindersSent++;
      } catch (emailError) {
        console.error(`Error sending reminder for payment ${payment.id}:`, emailError);
        errors.push(`Payment ${payment.id}: ${emailError.message}`);
      }
    }

    console.log(`Finished sending reminders. Sent: ${remindersSent}, Errors: ${errors.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        remindersSent,
        totalExpiring: expiringPayments.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-expiry-reminders:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});