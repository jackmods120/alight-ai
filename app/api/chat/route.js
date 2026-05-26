import ALIGHT_MOTION_KNOWLEDGE from '../../../lib/knowledge';

export const runtime = 'edge';

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { message } = await req.json();

    if (!message || message.trim() === '') {
      return new Response(JSON.stringify({ error: 'پرسیار بنووسە' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_KEY) {
      return new Response(JSON.stringify({ error: 'API key نییە' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const systemPrompt = `تۆ یارمەتیدەری زیرەکی (AI) بۆ Alight Motionی. ناوت "یارمەتیدەری AI"یە.

دەستوورەکان:
1. تەنها بە کوردیی سۆرانی وەڵام بدە
2. تەنها دەربارەی Alight Motion وەڵام بدە
3. ئەگەر پرسیار دەربارەی شتی دیکە بوو، بڵێ "تەنها دەربارەی Alight Motion وەڵام دەدەم"
4. وەڵامەکانت کورت، ڕوون و بەسوود بن
5. ئەگەر پرسیاری ناڕوون بوو، زیاتر وردبکەرەوە

زانیاریەکانت:
${ALIGHT_MOTION_KNOWLEDGE}

یادەوەری: وەڵامی ئەو پرسیارانە بدە کە لە زانیارییەکانی سەرەوەدا هەن. ئەگەر نەبوو، بڵێ ناتوانیت وەڵامی بدەیت بەڵام پێشنیار بکە.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: systemPrompt + '\n\nپرسیاری بەکارهێنەر: ' + message }]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1024,
            topP: 0.8,
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
          ]
        })
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error('Gemini error:', err);
      return new Response(JSON.stringify({ error: 'هەڵەی سێرڤەر' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      return new Response(JSON.stringify({ error: 'وەڵامی نەهات' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'هەڵەی نەزانراو: ' + error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
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
