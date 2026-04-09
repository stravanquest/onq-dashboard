import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [time, setTime] = useState(new Date());
  const [dailyLogs, setDailyLogs] = useState([]);
  const [logsUpdatedAt, setLogsUpdatedAt] = useState('');
  const [logsFolderUrl, setLogsFolderUrl] = useState('');
  const [todayFocus, setTodayFocus] = useState([]);
  const [focusUpdatedAt, setFocusUpdatedAt] = useState('');
  const [usage, setUsage] = useState([]);
  const [usageUpdatedAt, setUsageUpdatedAt] = useState('');
  const [usageStateExists, setUsageStateExists] = useState(true);
  const [usageThresholds, setUsageThresholds] = useState({ warning: 65, switchAt: 80 });
  const [modelInfo, setModelInfo] = useState({ current_model: 'loading...', provider: '', fallbacks: [] });

  // Quote changes once per day (seeded by today's date so it stays consistent all day)
  const quotes = [
    { text: 'The way to get started is to quit talking and begin doing.', author: 'Walt Disney' },
    { text: 'Innovation distinguishes between a leader and a follower.', author: 'Steve Jobs' },
    { text: 'Your most unhappy customers are your greatest source of learning.', author: 'Bill Gates' },
    { text: 'Success is walking from failure to failure with no loss of enthusiasm.', author: 'Winston Churchill' },
    { text: 'The only limit to our realization of tomorrow will be our doubts of today.', author: 'FDR' },
    { text: 'Ideas are easy. Implementation is hard.', author: 'Guy Kawasaki' },
    { text: 'The biggest risk is not taking any risk.', author: 'Mark Zuckerberg' },
  ];
  const quoteIndex = (() => {
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    return seed % quotes.length;
  })();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);

    async function loadDashboardData() {
      try {
        const logsRes = await fetch('/daily-logs/index.json');
        if (logsRes.ok) {
          const logsJson = await logsRes.json();
          setDailyLogs(logsJson.entries || []);
          setLogsUpdatedAt(logsJson.updated_at || '');
          setLogsFolderUrl(logsJson.dropbox_folder_url || '');
        }
      } catch (e) {
        console.error('Failed to load daily logs index', e);
      }

      try {
        const focusRes = await fetch('/today-focus.json');
        if (focusRes.ok) {
          const focusJson = await focusRes.json();
          setTodayFocus(focusJson.items || []);
          setFocusUpdatedAt(focusJson.updated_at || '');
        }
      } catch (e) {
        console.error('Failed to load today focus', e);
      }

      try {
        const usageRes = await fetch('/usage.json');
        if (usageRes.ok) {
          const usageJson = await usageRes.json();
          setUsage(usageJson.providers || []);
          setUsageUpdatedAt(usageJson.updated_at || '');
          setUsageStateExists(usageJson.state_file_exists !== false);
          setUsageThresholds({
            warning: usageJson.warning_threshold || 65,
            switchAt: usageJson.switch_threshold || 80,
          });
        }
      } catch (e) {
        console.error('Failed to load usage', e);
      }

      try {
        const modelRes = await fetch('/model-info.json');
        if (modelRes.ok) {
          const modelJson = await modelRes.json();
          setModelInfo(modelJson);
        }
      } catch (e) {
        console.error('Failed to load model info', e);
      }
    }

    loadDashboardData();

    // Auto-refresh data every 10 minutes (aligned with usage tracker cron)
    const refresher = setInterval(loadDashboardData, 10 * 60 * 1000);

    return () => {
      clearInterval(timer);
      clearInterval(refresher);
    };
  }, []);

  return (
    <div style={s.container}>
      <div style={s.header}>
        <h1 style={s.title}>🤖 OnQ Control Center</h1>
        <p style={s.subtitle}>Chris&apos;s AI Operations Dashboard</p>
        <div style={s.clock}>
          <div style={s.date}>{time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
          <div style={s.time}>{time.toLocaleTimeString('en-US')}</div>
        </div>
        <div style={s.quote}>
          &quot;{quotes[quoteIndex].text}&quot; <br />
          <span style={{ fontSize: '0.9em', opacity: 0.8 }}>— {quotes[quoteIndex].author}</span>
        </div>
      </div>

      <div style={s.grid}>
        <div style={s.card}>
          <h2 style={s.cardTitle}>🔗 Quick Links</h2>
          <a href="https://linkedin.com" target="_blank" rel="noreferrer" style={s.link}>💼 LinkedIn</a>
          <a href="https://dropbox.com" target="_blank" rel="noreferrer" style={s.link}>📁 Dropbox</a>
          <a href="https://github.com/stravanquest" target="_blank" rel="noreferrer" style={s.link}>👨‍💻 GitHub</a>
          <a href="https://vercel.com" target="_blank" rel="noreferrer" style={s.link}>▲ Vercel</a>
        </div>

        <div style={s.card}>
          <h2 style={s.cardTitle}>📊 Usage</h2>
          {!usageStateExists ? (
            <div>
              <div style={s.warnBox}>Usage tracker state file is missing. Showing the dashboard honestly instead of fake zeroes.</div>
              <div style={s.small}>Expected source: ~/.hermes/usage_tracker_state.json</div>
              <div style={s.small}>Updated: {usageUpdatedAt || 'n/a'}</div>
            </div>
          ) : usage.length === 0 ? (
            <div style={s.small}>Usage snapshot unavailable.</div>
          ) : (
            <div>
              {usage.map((p) => (
                <div key={p.key} style={s.usageRow}>
                  <div style={s.usageHead}>
                    <b>{p.label}</b>
                    <span style={p.status === 'critical' ? s.critical : p.status === 'warning' ? s.warn : s.okInline}>
                      {p.percent}%
                    </span>
                  </div>
                  <div style={s.small}>
                    {p.tokens.toLocaleString()} tokens used • ${(p.cost || 0).toFixed(4)} est.
                  </div>
                </div>
              ))}
              <div style={s.small}>Thresholds: warn {usageThresholds.warning}% • switch {usageThresholds.switchAt}%</div>
              <div style={s.small}>Total est. cost: ${(usage.reduce((sum, p) => sum + (p.cost || 0), 0)).toFixed(4)}</div>
              <div style={s.small}>Updated: {usageUpdatedAt || 'n/a'}</div>
            </div>
          )}
        </div>

        
        <div style={s.card}>
          <h2 style={s.cardTitle}>🧠 Current Model</h2>
          <div style={s.stat}><b>Model:</b> {modelInfo.current_model}</div>
          <div style={s.stat}><b>Provider:</b> {modelInfo.provider}</div>
          {modelInfo.fallbacks && modelInfo.fallbacks.length > 0 && (
            <div style={s.stat}><b>Fallbacks:</b> {modelInfo.fallbacks.join(' → ')}</div>
          )}
          <div style={s.stat}><b>Window:</b> {modelInfo.window_hours}h rolling</div>
          <div style={s.small}>Updated: {modelInfo.updated_at ? new Date(modelInfo.updated_at).toLocaleTimeString() : 'n/a'}</div>
        </div>


        <div style={s.card}>
          <h2 style={s.cardTitle}>🎛️ Status</h2>
          <div style={s.ok}>✅ OnQ Gateway: Running</div>
          <div style={s.ok}>✅ Backups: Daily 1:00 AM ET</div>
          <div style={s.ok}>✅ Arlanne: 100% Isolated</div>
        </div>

        <div style={s.card}>
          <h2 style={s.cardTitle}>⚡ Quick Actions</h2>
          <div style={s.cmd}>Terminal: <code>hermes gateway restart</code></div>
          <div style={s.cmd}>Terminal: <code>python3 ~/.onq/scripts/onq_usage_tracker.py --status</code></div>
          <p style={s.note}>Access from anywhere, always online</p>
        </div>

        <div style={s.cardWide}>
          <h2 style={s.cardTitle}>🗓️ Daily Logs</h2>
          {dailyLogs.length === 0 ? (
            <div style={s.small}>No logs indexed yet.</div>
          ) : (
            <div>
              {dailyLogs.map((entry) => (
                <div key={entry.path} style={s.logRow}>
                  <div>
                    <div style={s.logDate}>{entry.date}</div>
                    <div style={s.logTitle}>{entry.title}</div>
                  </div>
                  <a href={entry.path} target="_blank" rel="noreferrer" style={s.logLink}>Open Log</a>
                </div>
              ))}
            </div>
          )}
          <div style={s.small}>Index updated: {logsUpdatedAt || 'n/a'}</div>
          {logsFolderUrl ? (
            <a href={logsFolderUrl} target="_blank" rel="noreferrer" style={s.secondaryLink}>Open Dropbox Log Folder</a>
          ) : null}
        </div>

        <div style={s.cardWide}>
          <h2 style={s.cardTitle}>🎯 3 Things We Should Work On Today</h2>
          {todayFocus.length === 0 ? (
            <div style={s.small}>No focus items loaded.</div>
          ) : (
            <ol style={s.focusList}>
              {todayFocus.map((item) => (
                <li key={item.title} style={s.focusItem}>
                  <div style={s.focusTitle}>{item.title}</div>
                  <div style={s.focusDetail}>{item.detail}</div>
                </li>
              ))}
            </ol>
          )}
          <div style={s.small}>Generated from conversations + todo scan • updated: {focusUpdatedAt || 'n/a'}</div>
        </div>
      </div>

      <div style={s.footer}>Built for Chris by Q</div>
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
  cardWide: { background: 'white', borderRadius: '15px', padding: '25px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', gridColumn: '1 / -1' },
  cardTitle: { color: '#667eea', fontSize: '1.3em', margin: '0 0 20px 0', borderBottom: '2px solid #f0f0f0', paddingBottom: '10px' },
  stat: { padding: '8px 0', borderBottom: '1px solid #f0f0f0' },
  small: { fontSize: '0.85em', color: '#666', marginTop: '10px' },
  ok: { color: '#28a745', padding: '8px 0', fontWeight: 'bold' },
  okInline: { color: '#28a745', fontWeight: 'bold' },
  warn: { color: '#d97706', fontWeight: 'bold' },
  warnBox: { background: '#fef3c7', color: '#92400e', padding: '12px', borderRadius: '8px', fontWeight: 'bold', border: '1px solid #f59e0b', marginBottom: '10px' },
  critical: { color: '#dc2626', fontWeight: 'bold' },
  usageRow: { borderBottom: '1px solid #f0f0f0', padding: '10px 0' },
  usageHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' },
  link: { display: 'block', background: '#f5f5f5', padding: '12px', borderRadius: '8px', textDecoration: 'none', color: '#667eea', fontWeight: 'bold', marginBottom: '8px', textAlign: 'center' },
  cmd: { background: '#f5f5f5', padding: '10px', borderRadius: '6px', margin: '8px 0', fontSize: '0.9em' },
  note: { fontSize: '0.85em', color: '#666', marginTop: '15px', fontStyle: 'italic' },
  logRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0', padding: '10px 0' },
  logDate: { fontWeight: 'bold' },
  logTitle: { fontSize: '0.9em', color: '#555' },
  logLink: { textDecoration: 'none', background: '#667eea', color: 'white', borderRadius: '6px', padding: '6px 10px', fontSize: '0.85em' },
  secondaryLink: { display: 'inline-block', marginTop: '12px', textDecoration: 'none', color: '#667eea', fontWeight: 'bold' },
  focusList: { margin: 0, paddingLeft: '18px' },
  focusItem: { marginBottom: '12px' },
  focusTitle: { fontWeight: 'bold' },
  focusDetail: { fontSize: '0.9em', color: '#555', marginTop: '4px' },
  footer: { textAlign: 'center', color: 'white', marginTop: '40px', fontSize: '0.9em', opacity: 0.8 }
};
