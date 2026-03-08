import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { leadId } = await req.json();
    if (!leadId) {
      return new Response(JSON.stringify({ error: "leadId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch lead details
    const { data: lead, error: leadErr } = await supabase
      .from("leads")
      .select("*")
      .eq("id", leadId)
      .single();

    if (leadErr || !lead) {
      return new Response(JSON.stringify({ error: "Lead not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!lead.email) {
      return new Response(JSON.stringify({ error: "Lead has no email address" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the capturing user's profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", lead.captured_by)
      .single();

    const senderName = profile?.display_name || "Our Team";

    // Fetch any follow-up booking
    const { data: booking } = await supabase
      .from("follow_up_bookings")
      .select("*")
      .eq("lead_id", leadId)
      .eq("status", "scheduled")
      .order("follow_up_date", { ascending: true })
      .limit(1)
      .single();

    // Generate personalized follow-up email using AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `You are a professional B2B sales follow-up email writer. Write concise, personalized emails. The sender is ${senderName}. You MUST call the generate_email tool.`,
          },
          {
            role: "user",
            content: `Write a follow-up email for:
- Lead name: ${lead.name}
- Title: ${lead.title || "N/A"}
- Company: ${lead.company || "N/A"}
- Needs: ${lead.bant_need?.join(", ") || "N/A"}
- Notes: ${lead.notes || "N/A"}
- Meeting scheduled: ${booking ? `Yes, on ${new Date(booking.follow_up_date).toLocaleString()} (${booking.meeting_type})` : "No meeting scheduled yet"}

Keep it professional, warm, and under 150 words.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_email",
              description: "Generate a follow-up email",
              parameters: {
                type: "object",
                properties: {
                  subject: { type: "string", description: "Email subject line" },
                  body: { type: "string", description: "Email body in plain text" },
                },
                required: ["subject", "body"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_email" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const emailContent = JSON.parse(toolCall.function.arguments);

    // Mark lead as email sent
    await supabase
      .from("leads")
      .update({ follow_up_email_sent: true, follow_up_email_sent_at: new Date().toISOString() })
      .eq("id", leadId);

    return new Response(JSON.stringify({
      success: true,
      email: {
        to: lead.email,
        subject: emailContent.subject,
        body: emailContent.body,
      },
      message: "Follow-up email generated. In production, this would be sent via your email provider. For now, the email content is returned for preview.",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("send-follow-up error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
