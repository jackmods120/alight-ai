import ALIGHT_MOTION_KNOWLEDGE from '../../../lib/knowledge';

export const runtime = 'edge';

export async function POST(req) {
  try {
    // خوێندنەوەی body بە شێوازی text سەرەتا
    const bodyText = await req.text();
    
    if (!bodyText || bodyText.trim() === '') {
      return Response.json({ error: 'پرسیار بنووسە' }, { status: 400 });
    }

    let message = '';
    try {
      const parsed = JSON.parse(bodyText);
      message = parsed.message || '';
    } catch {
      return Response.json({ error: 'JSON هەڵەیە' }, { status: 400 });
    }

    if (!message.trim()) {
      return Response.json({ error: 'پرسیار بوش نەبێت' }, { status: 400 });
    }

    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_KEY) {
      return Response.json({ error: 'API key نییە' }, { status: 500 });
    }

    const systemPrompt = `تۆ یارمەتیدەری زیرەکی (AI) بۆ Alight Motionی. ناوت "یارمەتیدەری AI"یە.

دەستوورەکان:
1. تەنها بە کوردیی سۆرانی وەڵام بدە
2. تەنها دەربارەی Alight Motion وەڵام بدە
3. ئەگەر پرسیار دەربارەی شتی دیکە بوو، بڵێ "تەنها دەربارەی Alight Motion وەڵام دەدەم"
4. وەڵامەکانت کورت، ڕوون و بەسوود بن
5. ئەگەر پرسیاری ناڕوون بوو، زیاتر وردبکەرەوە

زانیاریەکانت:
${ALIGHT_MOTION_KNOWLEDGE}`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{ text: systemPrompt + '\n\nپرسیاری بەکارهێنەر: ' + message }]
          }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1024,
          }
        })
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini error:', errText);
      return Response.json({ error: 'هەڵەی Gemini: ' + geminiRes.status }, { status: 500 });
    }

    const data = await geminiRes.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      return Response.json({ error: 'وەڵامی نەهات' }, { status: 500 });
    }

    return Response.json({ reply }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    });

  } catch (error) {
    console.error('Server error:', error);
    return Response.json({ error: 'هەڵەی سێرڤەر: ' + error.message }, { status: 500 });
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
