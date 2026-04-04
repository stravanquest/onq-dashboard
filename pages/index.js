import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [time, setTime] = useState(new Date());
  const [quoteIndex, setQuoteIndex] = useState(0);

  const quotes = [
    { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
    { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
    { text: "Your most unhappy customers are your greatest source of learning.", author: "Bill Gates" },
    { text: "Success is walking from failure to failure with no loss of enthusiasm.", author: "Winston Churchill" },
    { text: "The only limit to our realization of tomorrow will be our doubts of today.", author: "FDR" },
    { text: "Ideas are easy. Implementation is hard.", author: "Guy Kawasaki" },
    { text: "The biggest risk is not taking any risk.", author: "Mark Zuckerberg" },
  ];

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    const quoter = setInterval(() => setQuoteIndex(i => (i + 1) % quotes.length), 30000);
    return () => { clearInterval(timer); clearInterval(quoter); };
  }, []);

  return (
    <div style={s.container}>
      <div style={s.header}>
        <h1 style={s.title}>🤖 OnQ Control Center</h1>
        <p style={s.subtitle}>Chris's AI Operations Dashboard</p>
        <div style={s.clock}>
          <div style={s.date}>{time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
          <div style={s.time}>{time.toLocaleTimeString('en-US')}</div>
        </div>
        <div style={s.quote}>"{quotes[quoteIndex].text}" <br/><span style={{fontSize:'0.9em',opacity:0.8}}>— {quotes[quoteIndex].author}</span></div>
      </div>

      <div style={s.grid}>
        <div style={s.card}><h2 style={s.cardTitle}>🔗 Quick Links</h2>
          <a href="https://linkedin.com" target="_blank" style={s.link}>💼 LinkedIn</a>
          <a href="https://dropbox.com" target="_blank" style={s.link}>📁 Dropbox</a>
          <a href="https://github.com/stravanquest" target="_blank" style={s.link}>👨‍💻 GitHub</a>
          <a href="https://vercel.com" target="_blank" style={s.link}>▲ Vercel</a>
        </div>

        <div style={s.card}><h2 style={s.cardTitle}>🧠 Models</h2>
          <div style={s.stat}><b>OnQ:</b> qwen/qwen3.5-plus</div>
          <div style={s.stat}><b>Arlanne:</b> qwen/qwen3.5-27b (isolated)</div>
          <div style={s.stat}><b>OpenClaw:</b> qwen/qwen3.5-9b</div>
          <div style={s.small}>Fallback: qwen3.5-27b → claude-sonnet-3.7</div>
        </div>

        <div style={s.card}><h2 style={s.cardTitle}>🎛️ Status</h2>
          <div style={s.ok}>✅ OnQ Gateway: Running</div>
          <div style={s.ok}>✅ Arlanne Gateway: Running</div>
          <div style={s.ok}>✅ OpenClaw: Approved</div>
          <div style={s.ok}>✅ Backups: Daily 3:45 AM</div>
        </div>

        <div style={s.card}><h2 style={s.cardTitle}>⚡ Quick Actions</h2>
          <div style={s.cmd}>Terminal: <code>onq dashboard</code></div>
          <div style={s.cmd}>Terminal: <code>onq restart</code></div>
          <p style={s.note}>Access from anywhere, always online</p>
        </div>
      </div>

      <div style={s.footer}>Built for Chris by Q • Always here • Always yours ❤️</div>
    </div>
  );
}

const s = {
  container: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', minHeight: '100vh', padding: '20px', color: '#333' },
  header: { textAlign: 'center', color: 'white', marginBottom: '30px' },
  title: { fontSize: '2.5em', margin: '0 0 10px 0' },
  subtitle: { fontSize: '1.1em', margin: '0 0 20px 0', opacity: 0.9 },
  clock: { background: 'rgba(255,255,255,0.15)', borderRadius: '10px', padding: '20px', margin: '20px auto', maxWidth: '400px' },
  date: { fontSize: '1.1em', marginBottom: '5px' },
  time: { fontSize: '2em', fontWeight: 'bold', letterSpacing: '2px' },
  quote: { fontStyle: 'italic', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', padding: '20px', margin: '20px auto', maxWidth: '600px', fontSize: '1.1em', lineHeight: '1.4' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', maxWidth: '1200px', margin: '0 auto' },
  card: { background: 'white', borderRadius: '15px', padding: '25px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' },
  cardTitle: { color: '#667eea', fontSize: '1.3em', margin: '0 0 20px 0', borderBottom: '2px solid #f0f0f0', paddingBottom: '10px' },
  stat: { padding: '8px 0', borderBottom: '1px solid #f0f0f0' },
  small: { fontSize: '0.85em', color: '#666', marginTop: '10px' },
  ok: { color: '#28a745', padding: '8px 0', fontWeight: 'bold' },
  link: { display: 'block', background: '#f5f5f5', padding: '12px', borderRadius: '8px', textDecoration: 'none', color: '#667eea', fontWeight: 'bold', marginBottom: '8px', textAlign: 'center' },
  cmd: { background: '#f5f5f5', padding: '10px', borderRadius: '6px', margin: '8px 0', fontSize: '0.9em' },
  note: { fontSize: '0.85em', color: '#666', marginTop: '15px', fontStyle: 'italic' },
  footer: { textAlign: 'center', color: 'white', marginTop: '40px', fontSize: '0.9em', opacity: 0.8 }
};
