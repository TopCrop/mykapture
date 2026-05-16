import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MODEL = "gemini-2.5-flash";

function stripNarration(text: string): string {
  if (!text) return text;
  const narrationPrefix = /^[\s•\-]*(?:(?:The |A )?(?:speaker|user|rep|person|caller|sales rep|sales person|individual|presenter|attendee)[\s,]*(?:says?|said|mentions?|mentioned|states?|stated|describes?|described|explains?|explained|notes?|noted|talks? about|talked about|discusses?|discussed|indicates?|indicated|reports?|reported|shares?|shared|highlights?|highlighted|refers? to|referred to|is saying|is mentioning|is describing|is explaining|is noting|is discussing|is indicating|is reporting|is sharing|is highlighting|has mentioned|has stated|has noted|has described|has explained|has indicated|has reported|has shared|has highlighted|expressed|conveys?|conveyed|communicates?|communicated|points? out|pointed out|brings? up|brought up|raises?|raised|outlines?|outlined|summarizes?|summarized|elaborates?|elaborated|clarifies?|clarified|specifies?|specified|remarks?|remarked|observes?|observed|comments?|commented|announces?|announced|reveals?|revealed|discloses?|disclosed|acknowledges?|acknowledged|confirms?|confirmed|adds?|added|continues?|continued|concludes?|concluded|begins? by|starts? by|goes on to|proceeds to|then (?:says?|mentions?|states?|describes?|explains?|notes?|discusses?|indicates?|reports?|shares?|highlights?))[:\s,]*)/gmi;
  const accordingTo = /^[\s•\-]*(?:According to (?:the )?(?:speaker|user|rep|person|caller|sales rep|sales person|individual|presenter|attendee))[,:\s]*/gmi;

  let cleaned = text.replace(narrationPrefix, (match) => {
    const bulletMatch = match.match(/^(\s*[•\-]\s*)/);
    return bulletMatch ? bulletMatch[1] : '';
  });
  cleaned = cleaned.replace(accordingTo, (match) => {
    const bulletMatch = match.match(/^(\s*[•\-]\s*)/);
    return bulletMatch ? bulletMatch[1] : '';
  });
  cleaned = cleaned.replace(/^[\s]*[•\-]\s*$/gm, '');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();
  return cleaned;
}

const SYSTEM_PROMPT = `You are writing notes AS a sales rep — first-person field notes, not a description of what someone said.

ABSOLUTE RULES:
1. Output ONLY bullet points. No paragraphs, no prose, no sentences.
2. Write in English regardless of the language spoken.
3. NEVER use third-person narration. The following phrases are BANNED and must NEVER appear in your output:
   - "The speaker", "The user", "The rep", "The person", "The caller", "The sales rep", "The individual", "The presenter", "The attendee"
   - "says", "mentions", "states", "describes", "explains", "notes", "discusses", "indicates", "reports", "shares", "highlights", "talks about", "refers to", "expressed", "conveyed", "communicated", "points out", "brings up", "outlined", "elaborated", "remarked", "observed", "commented", "acknowledged", "confirmed", "concluded"
   - "According to the speaker", "He/She says", "They mention"
4. Each bullet is a direct factual note — as if the rep typed it themselves.

WRONG (never do this):
• The speaker mentions they met a VP of Sales
• The rep says the prospect needs a CRM solution
• According to the speaker, budget is confirmed for Q2

RIGHT (always do this):
• Met VP of Sales at TechCorp booth
• Prospect needs CRM solution — currently using spreadsheets
• Budget confirmed for Q2, decision by end of month

Extract: prospect details, pain points, budget signals, timeline, next steps, and any other relevant sales context.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    if (body.ping === true) {
      return new Response(JSON.stringify({ status: "warm" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { audioBase64, format = "webm" } = body;
    if (!audioBase64) {
      return new Response(JSON.stringify({ error: "No audio provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!GOOGLE_AI_API_KEY) throw new Error("GOOGLE_AI_API_KEY is not configured");

    const audioMime = `audio/${format === "mp3" ? "mp3" : format}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GOOGLE_AI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [
            {
              role: "user",
              parts: [
                { text: "Extract all key information from this voice note into structured bullet points. Write as direct first-person sales notes — never narrate or describe what the speaker said." },
                { inlineData: { mimeType: audioMime, data: audioBase64 } },
              ],
            },
          ],
          tools: [
            {
              functionDeclarations: [
                {
                  name: "transcribe_audio",
                  description: "Return structured meeting notes and extracted lead details from a voice note. All text must be first-person sales notes — NEVER third-person narration.",
                  parameters: {
                    type: "object",
                    properties: {
                      transcription: { type: "string", description: "Bullet-point notes in English only. Each bullet is a direct factual statement written as the sales rep. No prose, no paragraphs, no third-person narration." },
                      extracted_name: { type: "string", description: "Person name mentioned, if any" },
                      extracted_company: { type: "string", description: "Company mentioned, if any" },
                      extracted_needs: { type: "string", description: "Needs or pain points mentioned, if any" },
                      extracted_timeline: { type: "string", description: "Timeline or urgency mentioned, if any" },
                      summary: { type: "string", description: "Brief 1-2 sentence summary in English. Write as first-person sales notes." },
                    },
                    required: ["transcription"],
                  },
                },
              ],
            },
          ],
          toolConfig: {
            functionCallingConfig: { mode: "ANY", allowedFunctionNames: ["transcribe_audio"] },
          },
          generationConfig: { maxOutputTokens: 800 },
        }),
      },
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts ?? [];
    const fnCall = parts.find((p: any) => p.functionCall)?.functionCall;
    if (!fnCall) {
      throw new Error("No function call in Gemini response");
    }

    const result = fnCall.args ?? {};

    if (result.transcription) {
      result.transcription = stripNarration(result.transcription);
    }
    if (result.summary) {
      result.summary = stripNarration(result.summary);
    }

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
