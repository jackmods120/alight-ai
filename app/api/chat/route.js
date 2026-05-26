import ALIGHT_MOTION_KNOWLEDGE from '../../../lib/knowledge';

export const runtime = 'edge';

export async function POST(req) {
  try {
    const bodyText = await req.text();
    if (!bodyText || bodyText.trim() === '') {
      return Response.json({ error: 'پرسیار بنووسە' }, { status: 400 });
    }

    let message = '';
    try {
      const parsed = JSON.parse(bodyText);
      message = (parsed.message || '').trim();
    } catch {
      return Response.json({ error: 'JSON هەڵەیە' }, { status: 400 });
    }

    if (!message) {
      return Response.json({ error: 'پرسیار بوش نەبێت' }, { status: 400 });
    }

    const GROQ_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_KEY) {
      return Response.json({ error: 'GROQ_API_KEY نییە' }, { status: 500 });
    }

    const systemPrompt = `ناوت "یارمەتیدەری AI"یە. تەنها بە کوردیی سۆرانی وەڵام بدە. تەنها دەربارەی Alight Motion وەڵام بدە. ئەگەر پرسیار دەربارەی شتێکی دیکە بوو بڵێ "تەنها دەربارەی Alight Motion وەڵام دەدەم". وەڵامەکانت بە زانیاریی ئەمەی خوارەوە بن:

${ALIGHT_MOTION_KNOWLEDGE}`;

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.1,
        max_tokens: 1024,
      })
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error('Groq error:', groqRes.status, errText);
      return Response.json({ error: 'هەڵەی سێرڤەر: ' + groqRes.status }, { status: 500 });
    }

    const data = await groqRes.json();
    const reply = data?.choices?.[0]?.message?.content;

    if (!reply) {
      return Response.json({ error: 'وەڵامی نەهات' }, { status: 500 });
    }

    return Response.json({ reply }, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: 'هەڵە: ' + error.message }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}
