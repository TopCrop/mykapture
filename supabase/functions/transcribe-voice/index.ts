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
    const { audioBase64, format = "webm" } = await req.json();
    if (!audioBase64) {
      return new Response(JSON.stringify({ error: "No audio provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        max_tokens: 800,
        messages: [
          {
            role: "system",
            content: "You are a sales meeting note-taker. Listen to the audio and produce concise, well-structured meeting notes in English — NOT a verbatim transcript. The speaker may use any language, but your output MUST always be in English. Summarize key points, action items, and lead details. Call the transcribe_audio tool with your results.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Listen to this voice note from a sales rep at a conference. Produce structured meeting notes in English with key takeaways and any lead information mentioned." },
              {
                type: "input_audio",
                input_audio: {
                  data: audioBase64,
                  format: format,
                },
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "transcribe_audio",
              description: "Return structured meeting notes and extracted lead details from a voice note",
              parameters: {
                type: "object",
                properties: {
                  transcription: { type: "string", description: "Concise meeting notes in English summarizing key points, NOT a verbatim transcript. Use bullet points or short paragraphs." },
                  extracted_name: { type: "string", description: "Person name mentioned, if any" },
                  extracted_company: { type: "string", description: "Company mentioned, if any" },
                  extracted_needs: { type: "string", description: "Needs or pain points mentioned, if any" },
                  extracted_timeline: { type: "string", description: "Timeline or urgency mentioned, if any" },
                  summary: { type: "string", description: "Brief 1-2 sentence summary in English" },
                },
                required: ["transcription"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "transcribe_audio" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call in AI response");
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("transcribe-voice error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
