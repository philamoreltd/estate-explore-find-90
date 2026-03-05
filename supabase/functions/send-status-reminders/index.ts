import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting monthly status reminder check...");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Find properties not updated in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: staleProperties, error: propertiesError } = await supabase
      .from("properties")
      .select("id, title, location, rent_amount, status, user_id, updated_at")
      .eq("status", "available")
      .lte("updated_at", thirtyDaysAgo.toISOString());

    if (propertiesError) {
      console.error("Error fetching stale properties:", propertiesError);
      throw propertiesError;
    }

    console.log(`Found ${staleProperties?.length || 0} properties not updated in 30+ days`);

    if (!staleProperties || staleProperties.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No stale properties found", remindersSent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Group properties by landlord
    const landlordProperties: Record<string, typeof staleProperties> = {};
    for (const prop of staleProperties) {
      if (!landlordProperties[prop.user_id]) {
        landlordProperties[prop.user_id] = [];
      }
      landlordProperties[prop.user_id].push(prop);
    }

    let remindersSent = 0;
    const errors: string[] = [];

    for (const [userId, properties] of Object.entries(landlordProperties)) {
      try {
        // Get landlord profile
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("user_id", userId)
          .maybeSingle();

        if (profileError || !profile?.email) {
          console.log(`No email found for landlord ${userId}, skipping`);
          continue;
        }

        const propertyListHtml = properties
          .map(
            (p) => `
            <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 12px 0;">
              <h3 style="color: #333; font-size: 16px; margin: 0 0 8px 0;">${p.title}</h3>
              <p style="color: #666; margin: 4px 0;">📍 ${p.location}</p>
              <p style="color: #666; margin: 4px 0;">💰 KES ${Number(p.rent_amount).toLocaleString()} /month</p>
              <p style="color: #999; margin: 4px 0; font-size: 13px;">Last updated: ${new Date(p.updated_at).toLocaleDateString("en-KE", { year: "numeric", month: "long", day: "numeric" })}</p>
            </div>`
          )
          .join("");

        const appUrl = Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".lovable.app") || "https://housevilla.lovable.app";

        console.log(`Sending status reminder to ${profile.email} for ${properties.length} properties`);

        const emailResponse = await resend.emails.send({
          from: "Pata Keja <notifications@resend.dev>",
          to: [profile.email],
          subject: `Action needed: Update your property status (${properties.length} ${properties.length === 1 ? "property" : "properties"})`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #333; font-size: 24px;">Monthly Property Status Reminder</h1>
              
              <p style="color: #666; font-size: 16px;">
                Hi ${profile.full_name || "there"},
              </p>
              
              <p style="color: #666; font-size: 16px;">
                The following ${properties.length === 1 ? "property has" : "properties have"} not been updated in over 30 days. 
                Please review and confirm whether ${properties.length === 1 ? "it is" : "they are"} still <strong>available</strong> or now <strong>occupied</strong>.
              </p>
              
              ${propertyListHtml}
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${appUrl}/landlords" 
                   style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Update My Properties
                </a>
              </div>
              
              <p style="color: #999; font-size: 14px; border-top: 1px solid #eee; padding-top: 20px;">
                Keeping your listings up to date helps tenants find available properties faster and improves your listing visibility.
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
        console.error(`Error sending reminder for landlord ${userId}:`, emailError);
        errors.push(`Landlord ${userId}: ${emailError.message}`);
      }
    }

    console.log(`Finished. Reminders sent: ${remindersSent}, Errors: ${errors.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        remindersSent,
        totalLandlords: Object.keys(landlordProperties).length,
        totalStaleProperties: staleProperties.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-status-reminders:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
