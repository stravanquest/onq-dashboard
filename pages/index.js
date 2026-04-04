import { useEffect, useState } from 'react';
import { getLogPriorityColor, getLogIcon } from '../lib/logHelpers';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [restartStatus, setRestartStatus] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weather, setWeather] = useState(null);
  const [logs, setLogs] = useState([]);
  const [quote, setQuote] = useState(null);
  const [currentModels, setCurrentModels] = useState({ onq: 'qwen/qwen3.5-plus', arlanne: 'qwen/qwen3.5-27b' });

  useEffect(() => {
    fetchData();
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    const interval = setInterval(fetchData, 30000);
    
    // Fetch weather
    fetchWeather();
    const weatherInterval = setInterval(fetchWeather, 300000);
    
    // Fetch logs
    fetchLogs();
    const logsInterval = setInterval(fetchLogs, 10000);
    
    // Fetch quote
    fetchQuote();
    const quoteInterval = setInterval(fetchQuote, 30000); // New quote every 30 sec
    
    return () => {
      clearInterval(timeInterval);
      clearInterval(interval);
      clearInterval(weatherInterval);
      clearInterval(logsInterval);
      clearInterval(quoteInterval);
    };
  }, []);

  async function fetchQuote() {
    try {
      const res = await fetch('/api/quote');
      const result = await res.json();
      setQuote(result);
    } catch (error) {
      console.error('Quote fetch failed:', error);
    }
  }

  async function fetchData() {
    try {
      const res = await fetch('/api/usage');
      const result = await res.json();
      setData(result);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setLoading(false);
    }
  }

  async function handleRestart(agent) {
    setRestartStatus(`Restarting ${agent}...`);
    try {
      const res = await fetch('/api/restart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent })
      });
      const result = await res.json();
      setRestartStatus(result.message || 'Restarted!');
      setTimeout(() => setRestartStatus(null), 3000);
    } catch (error) {
      setRestartStatus('Restart failed');
      setTimeout(() => setRestartStatus(null), 3000);
    }
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h1>🤖 OnQ Control Center</h1>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>🤖 OnQ Control Center</h1>
        <p>Chris's AI Operations Dashboard</p>
        <div style={styles.dateTime}>
          <div style={styles.date}>{currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
          <div style={styles.time}>{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
        </div>
        {quote && (
          <div style={styles.quoteBox}>
            <div style={styles.quoteText}>"{quote.text}"</div>
            <div style={styles.quoteAuthor}>— {quote.author}</div>
          </div>
        )}
      </div>

      <div style={styles.grid}>
        {/* Usage Card */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>📊 API Usage</h2>
          {data?.usage?.openai_codex && (
            <div style={styles.stat}>
              <div style={styles.statLabel}>OpenAI Codex</div>
              <div style={styles.statValue}>
                {data.usage.openai_codex.messages} msgs / {data.usage.openai_codex.pct.toFixed(1)}%
              </div>
              <span style={getStatusStyle(data.usage.openai_codex.pct)}>
                {data.usage.openai_codex.pct >= 85 ? '🔴 CRITICAL' : data.usage.openai_codex.pct >= 82 ? '🟡 WARNING' : '🟢 OK'}
              </span>
              <div style={styles.statDetail}>{data.usage.openai_codex.tokens.toLocaleString()} tokens</div>
            </div>
          )}
          {data?.usage?.openrouter && (
            <div style={styles.stat}>
              <div style={styles.statLabel}>OpenRouter</div>
              <div style={styles.statValue}>
                {data.usage.openrouter.messages} msgs / {data.usage.openrouter.pct.toFixed(1)}%
              </div>
              <span style={getStatusStyle(data.usage.openrouter.pct)}>
                {data.usage.openrouter.pct >= 85 ? '🔴 CRITICAL' : data.usage.openrouter.pct >= 82 ? '🟡 WARNING' : '🟢 OK'}
              </span>
              <div style={styles.statDetail}>{data.usage.openrouter.tokens.toLocaleString()} tokens</div>
            </div>
          )}
        </div>

        {/* Models Card - NEW! */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>🧠 Active Models</h2>
          <div style={styles.stat}>
            <div style={styles.statLabel}>OnQ (Primary)</div>
            <div style={styles.statValue}>{currentModels.onq}</div>
            <div style={styles.statDetail}>OpenRouter • Main operator</div>
          </div>
          <div style={styles.stat}>
            <div style={styles.statLabel}>Arlanne</div>
            <div style={styles.statValue}>{currentModels.arlanne}</div>
            <div style={styles.statDetail}>OpenRouter • PM assistant (isolated)</div>
          </div>
          <div style={styles.stat}>
            <div style={styles.statLabel}>OpenClaw</div>
            <div style={styles.statValue}>qwen/qwen3.5-9b</div>
            <div style={styles.statDetail}>OpenRouter • Execution (cheap/fast)</div>
          </div>
          <hr style={{margin: '15px 0', border: 'none', borderTop: '1px solid #eee'}}/>
          <div style={styles.statLabel} style={{fontWeight: 'bold', marginBottom: '10px'}}>Fallback Chain:</div>
          <div style={{fontSize: '0.85em', color: '#666'}}>
            <div>① qwen/qwen3.5-27b → ② claude-sonnet-3.7</div>
          </div>
        </div>

        {/* Controls Card - NEW! */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>🎛️ Quick Controls</h2>
          <div style={styles.buttonGrid}>
            <button 
              style={styles.button} 
              onClick={() => handleRestart('onq')}
              onMouseOver={(e) => e.target.style.background = '#5560ee'}
              onMouseOut={(e) => e.target.style.background = '#667eea'}
            >
              🔄 Restart OnQ
            </button>
            <button 
              style={styles.button} 
              onClick={() => handleRestart('arlanne')}
              onMouseOver={(e) => e.target.style.background = '#5560ee'}
              onMouseOut={(e) => e.target.style.background = '#667eea'}
            >
              🔄 Restart Arlanne
            </button>
            <button 
              style={styles.button} 
              onClick={() => handleRestart('openclaw')}
              onMouseOver={(e) => e.target.style.background = '#5560ee'}
              onMouseOut={(e) => e.target.style.background = '#667eea'}
            >
              🔄 Restart OpenClaw
            </button>
            <a 
              href="https://github.com/stravanquest/onq-dashboard"
              target="_blank"
              rel="noopener noreferrer"
              style={{...styles.button, background: '#333'}}
              onMouseOver={(e) => e.target.style.background = '#555'}
              onMouseOut={(e) => e.target.style.background = '#333'}
            >
              🔗 GitHub Repo
            </a>
            <a 
              href="https://vercel.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              style={{...styles.button, background: '#0070f3'}}
              onMouseOver={(e) => e.target.style.background = '#0060df'}
              onMouseOut={(e) => e.target.style.background = '#0070f3'}
            >
              ⚙️ Vercel Dashboard
            </a>
            {restartStatus && (
              <div style={styles.statusMessage}>{restartStatus}</div>
            )}
          </div>
        </div>

        {/* Weather Card - NEW! */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>🌤️ Weather</h2>
          {weather ? (
            <>
              <div style={styles.stat}>
                <div style={styles.statLabel}>Location</div>
                <div style={styles.statValue}>{weather.location}</div>
              </div>
              <div style={styles.stat}>
                <div style={styles.statLabel}>Current</div>
                <div style={styles.statValue}>{weather.condition}</div>
              </div>
              <div style={styles.stat}>
                <div style={styles.statLabel}>Temperature</div>
                <div style={styles.statValue}>{weather.temp}°F</div>
              </div>
              <div style={styles.stat}>
                <div style={styles.statLabel}>Wind</div>
                <div style={styles.statValue}>{weather.windspeed} mph</div>
              </div>
            </>
          ) : (
            <div style={styles.statLabel}>Loading weather...</div>
          )}
        </div>

        {/* Logs Card - NEW! */}
        <div style={{...styles.card, gridColumn: '1 / -1'}}>
          <h2 style={styles.cardTitle}>📋 Activity Log</h2>
          <div style={styles.logsContainer}>
            {logs.length > 0 ? (
              logs.map((log, idx) => (
                <div key={idx} style={{
                  ...styles.logEntry,
                  borderLeft: `4px solid ${getLogPriorityColor(log.priority || log.type)}`
                }}>
                  <div style={styles.logTime}>{log.time}</div>
                  <div style={styles.logMessage}>
                    {getLogIcon(log.type)} {log.message || `${log.provider} call: ${log.tokens.toLocaleString()} tokens`}
                  </div>
                </div>
              ))
            ) : (
              <div style={styles.statLabel}>Loading logs...</div>
            )}
          </div>
        </div>

        {/* Backup Card */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>🛡️ Backup Status</h2>
          {data?.backups && (
            <>
              <div style={styles.stat}>
                <div style={styles.statLabel}>OnQ Last Backup</div>
                <div style={styles.statValue}>{data.backups.onq || 'No backup'}</div>
                {data.backups.onq && <span style={styles.statusOk}>✅ Current</span>}
              </div>
              <div style={styles.stat}>
                <div style={styles.statLabel}>Arlanne Last Backup</div>
                <div style={styles.statValue}>{data.backups.arlanne || 'No backup'}</div>
                {data.backups.arlanne && <span style={styles.statusOk}>✅ Current</span>}
              </div>
            </>
          )}
        </div>

        {/* Agent Status Card */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>🤖 Agents</h2>
          {data?.agents && (
            <>
              <AgentStatus name="OnQ Gateway" active={data.agents.onq} desc="Main operator" />
              <AgentStatus name="Arlanne Gateway" active={data.agents.arlanne} desc="PM assistant" />
              <AgentStatus name="OpenClaw" active={data.agents.openclaw} desc="Execution layer" />
            </>
          )}
        </div>

        {/* Quick Links Card - NEW! */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>🔗 Quick Links</h2>
          <div style={styles.linkList}>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" style={styles.link}>
              💼 LinkedIn
            </a>
            <a href="https://dropbox.com" target="_blank" rel="noopener noreferrer" style={styles.link}>
              📁 Dropbox
            </a>
            <a href="https://github.com/stravanquest" target="_blank" rel="noopener noreferrer" style={styles.link}>
              👨‍💻 GitHub
            </a>
            <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" style={styles.link}>
              ▲ Vercel
            </a>
            <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" style={styles.link}>
              🌐 OpenRouter
            </a>
          </div>
        </div>
      </div>

      <div style={styles.footer}>
        Auto-refreshes every 30 seconds • Last updated: {new Date().toLocaleString()}
      </div>
    </div>
  );
}

function AgentStatus({ name, active, desc }) {
  return (
    <div style={styles.agentStatus}>
      <div style={{...styles.agentDot, background: active ? '#28a745' : '#dc3545'}}></div>
      <div>
        <div style={{fontWeight: 'bold'}}>{name}</div>
        <div style={{fontSize: '0.85em', color: '#666'}}>{desc}</div>
      </div>
    </div>
  );
}

function getStatusStyle(pct) {
  if (pct >= 85) return styles.statusCrit;
  if (pct >= 82) return styles.statusWarn;
  return styles.statusOk;
}

const styles = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    minHeight: '100vh',
    padding: '20px',
  },
  header: {
    textAlign: 'center',
    color: 'white',
    marginBottom: '30px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    maxWidth: '1200px',
    margin: '0 auto 30px auto',
  },
  card: {
    background: 'white',
    borderRadius: '15px',
    padding: '25px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
  },
  cardTitle: {
    color: '#667eea',
    marginBottom: '20px',
    fontSize: '1.3em',
  },
  stat: {
    marginBottom: '15px',
    paddingBottom: '15px',
    borderBottom: '1px solid #eee',
  },
  statLabel: {
    color: '#666',
    fontSize: '0.9em',
    marginBottom: '5px',
  },
  statValue: {
    fontSize: '1.2em',
    fontWeight: 'bold',
    color: '#333',
  },
  statDetail: {
    fontSize: '0.85em',
    color: '#666',
    marginTop: '5px',
  },
  statusOk: {
    display: 'inline-block',
    padding: '5px 15px',
    borderRadius: '20px',
    fontSize: '0.85em',
    fontWeight: 'bold',
    marginTop: '5px',
    background: '#d4edda',
    color: '#155724',
  },
  statusWarn: {
    display: 'inline-block',
    padding: '5px 15px',
    borderRadius: '20px',
    fontSize: '0.85em',
    fontWeight: 'bold',
    marginTop: '5px',
    background: '#fff3cd',
    color: '#856404',
  },
  statusCrit: {
    display: 'inline-block',
    padding: '5px 15px',
    borderRadius: '20px',
    fontSize: '0.85em',
    fontWeight: 'bold',
    marginTop: '5px',
    background: '#f8d7da',
    color: '#721c24',
  },
  agentStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '12px',
  },
  agentDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
  },
  footer: {
    textAlign: 'center',
    color: 'white',
    opacity: '0.8',
    fontSize: '0.9em',
    marginTop: '20px',
  },
  dateTime: {
    textAlign: 'center',
    color: 'white',
    marginTop: '15px',
    padding: '15px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '10px',
  },
  date: {
    fontSize: '1.1em',
    marginBottom: '5px',
  },
  time: {
    fontSize: '2em',
    fontWeight: 'bold',
    letterSpacing: '2px',
  },
  quoteBox: {
    marginTop: '20px',
    padding: '20px',
    background: 'rgba(255,255,255,0.15)',
    borderRadius: '10px',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  quoteText: {
    fontSize: '1.1em',
    marginBottom: '8px',
    color: 'white',
    lineHeight: '1.4',
  },
  quoteAuthor: {
    fontSize: '0.9em',
    color: 'rgba(255,255,255,0.8)',
  },
  buttonGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '10px',
  },
  button: {
    background: '#667eea',
    color: 'white',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '8px',
    fontSize: '0.95em',
    fontWeight: 'bold',
    cursor: 'pointer',
    textAlign: 'center',
    textDecoration: 'none',
    display: 'block',
    transition: 'background 0.2s',
  },
  statusMessage: {
    textAlign: 'center',
    padding: '10px',
    background: '#e8f5e9',
    borderRadius: '8px',
    color: '#2e7d32',
    fontWeight: 'bold',
    marginTop: '10px',
  },
  linkList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  link: {
    color: '#667eea',
    textDecoration: 'none',
    padding: '8px 12px',
    borderRadius: '6px',
    background: '#f5f5f5',
    fontWeight: '500',
    transition: 'all 0.2s',
  },
  logsContainer: {
    maxHeight: '400px',
    overflowY: 'auto',
    background: '#f8f9fa',
    borderRadius: '8px',
    padding: '15px',
  },
  logEntry: {
    display: 'flex',
    gap: '15px',
    padding: '10px',
    marginBottom: '8px',
    background: 'white',
    borderRadius: '6px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  logTime: {
    fontSize: '0.85em',
    color: '#666',
    minWidth: '70px',
    fontWeight: '500',
  },
  logMessage: {
    flex: 1,
    fontSize: '0.9em',
    color: '#333',
  },
};
