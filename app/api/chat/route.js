import ALIGHT_MOTION_KNOWLEDGE from '../../../lib/knowledge';

export const runtime = 'edge';

// ═══ Rate limiting سادە ═══════════════════════════════
const requestTimes = new Map();
function isRateLimited(ip) {
  const now = Date.now();
  const times = requestTimes.get(ip) || [];
  const recent = times.filter(t => now - t < 10000); // 10 چرکە
  if (recent.length >= 3) return true;
  recent.push(now);
  requestTimes.set(ip, recent);
  return false;
}

export async function POST(req) {
  try {
    const bodyText = await req.text();
    if (!bodyText || bodyText.trim() === '') {
      return Response.json({ reply: 'پرسیارەکەت بنووسە تکایە.' });
    }

    let message = '';
    try {
      const parsed = JSON.parse(bodyText);
      message = (parsed.message || '').trim();
    } catch {
      return Response.json({ reply: 'پرسیارەکەت دووبارە بنووسە.' });
    }

    if (!message) {
      return Response.json({ reply: 'پرسیارەکەت بنووسە تکایە.' });
    }

    // ═══ پشکنینی API Key ══════════════════════════════
    const GROQ_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_KEY) {
      // هەرگیز بەکارهێنەر نازانێت کێشە لە API کەیە
      return Response.json({ 
        reply: 'ببورە، ئێستا کەمێک کێشەم هەیە. تکایە چەند خولەک راگرە و دووبارە تاقی بکەرەوە.' 
      });
    }

    const systemPrompt = `ناوت "یارمەتیدەری AI"یە. تەنها بە کوردیی سۆرانی وەڵام بدە. تەنها دەربارەی Alight Motion وەڵام بدە. ئەگەر پرسیار دەربارەی شتێکی دیکە بوو بڵێ "تەنها دەربارەی Alight Motion وەڵام دەدەم". وەڵامەکانت بە زانیاریی ئەمەی خوارەوە بن:

${ALIGHT_MOTION_KNOWLEDGE}`;

    // ═══ Retry logic: ئەگەر 429 بوو، کەمێک راگرە و دووبارە تاقی بکە ═══
    let lastError = '';
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) {
        // چاوەڕوان بە: 2s, 4s
        await new Promise(r => setTimeout(r, attempt * 2000));
      }

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
          max_tokens: 800,
        })
      });

      if (groqRes.ok) {
        const data = await groqRes.json();
        const reply = data?.choices?.[0]?.message?.content;
        if (reply) {
          return Response.json({ reply }, {
            headers: { 'Access-Control-Allow-Origin': '*' }
          });
        }
      }

      const status = groqRes.status;
      if (status === 429) {
        lastError = 'rate_limit';
        continue; // دووبارە تاقی بکەرەوە
      } else {
        lastError = 'server_' + status;
        break;
      }
    }

    // هەموو هەوڵەکان شکستی هێنا — پەیامی ئاساییی کوردی
    if (lastError === 'rate_limit') {
      return Response.json({ 
        reply: 'ببورە، ئێستا زۆر خەلک پرسیاریان دەکەم. تکایە چەند چرکە راگرە و دووبارە تاقی بکەرەوە.' 
      });
    }

    return Response.json({ 
      reply: 'ببورە، ئێستا کەمێک کێشەم هەیە. تکایە دووبارە تاقی بکەرەوە.' 
    });

  } catch (error) {
    console.error('Error:', error);
    // هیچ جار هەڵەی تەکنیکی نانووسین
    return Response.json({ 
      reply: 'ببورە، وەڵامت نەتوانم بدەمەوە. تکایە دووبارە تاقی بکەرەوە.' 
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
