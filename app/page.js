export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif', direction: 'rtl' }}>
      <h1>یارمەتیدەری AI بۆ Alight Motion</h1>
      <p>API سەرویسی چالاکە. بۆ بەکارهێنان POST request بنێرە بۆ <code>/api/chat</code></p>
      <pre style={{ background: '#1e1e1e', color: '#00ff88', padding: '1rem', borderRadius: '8px' }}>
{`POST /api/chat
Content-Type: application/json

{
  "message": "چۆن ئەنیمەیشن دروست بکەم؟"
}

Response:
{
  "reply": "..."
}`}
      </pre>
    </main>
  );
}
