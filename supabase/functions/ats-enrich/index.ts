import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { resumeText, overallScore, warnings, weakBullets } = await req.json();
    if (!resumeText || typeof resumeText !== 'string') {
      return json({ error: 'resumeText required' }, 400);
    }
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) return json({ error: 'AI unavailable' }, 500);

    const trimmed = resumeText.slice(0, 6000);
    const prompt = `You are a senior tech recruiter reviewing a resume for an Indian job market.
Resume text:
"""${trimmed}"""

Deterministic ATS score: ${overallScore}/100.
Known warnings: ${(warnings || []).slice(0, 8).join(' | ') || 'none'}.
Weak bullets: ${(weakBullets || []).slice(0, 5).join(' | ') || 'none'}.

Return STRICT JSON with keys:
- summary: 2-sentence recruiter impression
- topFixes: array of 3-5 highest-impact fixes (short imperative sentences)
- rewrites: array of {before, after, rationale} rewriting up to 3 weak bullets into strong, quantified, action-verb bullets
- missingKeywords: array of 5-8 in-demand keywords likely missing for the candidate's target role
No prose outside JSON.`;

    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You output only valid JSON.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (res.status === 429) return json({ error: 'Rate limited, try again shortly.' }, 429);
    if (res.status === 402) return json({ error: 'AI credits exhausted.' }, 402);
    if (!res.ok) return json({ error: 'AI request failed' }, 500);

    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content ?? '{}';
    let parsed: any = {};
    try { parsed = JSON.parse(raw); } catch { parsed = {}; }
    return json(parsed, 200);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}