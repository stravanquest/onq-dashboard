import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchDashboardData() {
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
    marginBottom: '30px',
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
    fontSize: '1.8em',
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
};
