import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, org_name, invite_url } = await req.json();

    if (!email || !org_name || !invite_url) {
      return new Response(JSON.stringify({ error: "email, org_name, and invite_url are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const htmlBody = `
      <div style="font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 24px; background: #ffffff;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 24px; font-weight: 700; color: #1a1a2e; margin: 0;">Kapture</h1>
        </div>
        <div style="background: #f8fafb; border-radius: 12px; padding: 32px 24px; border: 1px solid #e8ecf0;">
          <h2 style="font-size: 20px; font-weight: 600; color: #1a1a2e; margin: 0 0 12px;">You're invited!</h2>
          <p style="font-size: 15px; color: #4a5568; line-height: 1.6; margin: 0 0 24px;">
            You've been invited to join <strong style="color: #1a1a2e;">${org_name}</strong> on Kapture — the modern lead capture platform for B2B sales teams.
          </p>
          <a href="${invite_url}" style="display: inline-block; background: #1de8b5; color: #0a0c10; font-weight: 600; font-size: 15px; padding: 12px 28px; border-radius: 8px; text-decoration: none;">
            Accept Invitation
          </a>
          <p style="font-size: 13px; color: #8895a7; margin: 24px 0 0; line-height: 1.5;">
            This invitation expires in 7 days. If you didn't expect this email, you can safely ignore it.
          </p>
        </div>
        <p style="font-size: 12px; color: #a0aec0; text-align: center; margin-top: 24px;">
          Sent by Kapture · Lead Capture Platform
        </p>
      </div>
    `;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Kapture <onboarding@resend.dev>",
        to: [email],
        subject: `You're invited to join ${org_name} on Kapture`,
        html: htmlBody,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend API error:", resendResponse.status, JSON.stringify(resendData));
      throw new Error(`Resend API error [${resendResponse.status}]: ${JSON.stringify(resendData)}`);
    }

    return new Response(JSON.stringify({ success: true, id: resendData.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("send-invite-email error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
