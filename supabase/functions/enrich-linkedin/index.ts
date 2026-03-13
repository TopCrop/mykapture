const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { linkedinUrl } = await req.json();

    if (!linkedinUrl || !linkedinUrl.includes('linkedin.com')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Valid LinkedIn URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Enriching LinkedIn profile:', linkedinUrl);

    // Use Firecrawl to scrape the LinkedIn profile page
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: linkedinUrl,
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 3000,
      }),
    });

    const scrapeData = await scrapeResponse.json();

    if (!scrapeResponse.ok) {
      console.error('Firecrawl scrape error:', scrapeData);
      return new Response(
        JSON.stringify({ success: false, error: scrapeData.error || 'Failed to scrape LinkedIn profile' }),
        { status: scrapeResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const markdown = scrapeData.data?.markdown || scrapeData.markdown || '';
    const metadata = scrapeData.data?.metadata || scrapeData.metadata || {};

    if (!markdown || markdown.length < 50) {
      return new Response(
        JSON.stringify({
          success: true,
          contact: {},
          message: 'Could not extract enough data from the LinkedIn profile. It may be private or require login.',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use AI to extract structured contact info from the scraped markdown
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      // Fallback: return raw metadata if no AI key
      return new Response(
        JSON.stringify({
          success: true,
          contact: {
            name: metadata.title?.split(' - ')?.[0]?.split(' | ')?.[0]?.trim() || undefined,
            website: linkedinUrl,
          },
          message: 'Basic extraction only — AI enrichment unavailable.',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          {
            role: 'system',
            content: `You are a data extraction assistant. Extract contact information from a LinkedIn profile page. Return ONLY a JSON object with these fields (omit any you can't find): name, title, company, email, phone, website. The website should be the LinkedIn URL. Be precise — do not guess or hallucinate.`,
          },
          {
            role: 'user',
            content: `Extract contact info from this LinkedIn profile:\n\nURL: ${linkedinUrl}\n\nPage content:\n${markdown.substring(0, 4000)}`,
          },
        ],
        temperature: 0.1,
      }),
    });

    if (!aiResponse.ok) {
      const aiErr = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, aiErr);
      // Fallback to basic metadata extraction
      return new Response(
        JSON.stringify({
          success: true,
          contact: {
            name: metadata.title?.split(' - ')?.[0]?.split(' | ')?.[0]?.trim() || undefined,
            website: linkedinUrl,
          },
          message: 'Basic extraction only — AI enrichment failed.',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || '';

    // Parse JSON from the AI response
    let contact: Record<string, string> = {};
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        contact = JSON.parse(jsonMatch[0]);
      }
    } catch (parseErr) {
      console.error('Failed to parse AI response:', parseErr);
    }

    // Ensure website is set to the LinkedIn URL
    contact.website = linkedinUrl;

    console.log('Enrichment result:', contact);

    return new Response(
      JSON.stringify({ success: true, contact }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Enrichment error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to enrich profile';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
