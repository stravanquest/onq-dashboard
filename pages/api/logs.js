export default function handler(req, res) {
  const fs = require('fs');
  const path = require('path');
  
  try {
    // Read usage log
    const logPath = path.join(process.env.HOME || '/Users/visualriot', '.hermes', 'usage_tracker_log.csv');
    let logs = [];
    
    if (fs.existsSync(logPath)) {
      const content = fs.readFileSync(logPath, 'utf8');
      const lines = content.trim().split('\n').slice(-10); // Last 10 entries
      
      logs = lines.slice(1).map(line => {
        const [timestamp, provider, model, tokens_in, tokens_out, total] = line.split(',');
        return {
          time: new Date(timestamp).toLocaleTimeString(),
          provider: provider.replace('openrouter', 'OpenRouter').replace('openai-codex', 'OpenAI'),
          model: model || 'unknown',
          tokens: parseInt(total) || 0,
          type: 'api_call'
        };
      });
    }
    
    // Add system events (mock for now, can be enhanced)
    const systemEvents = [
      { time: new Date().toLocaleTimeString(), type: 'system', message: 'Dashboard loaded', priority: 'info' },
      { time: new Date(Date.now() - 3600000).toLocaleTimeString(), type: 'backup', message: 'OnQ backup completed', priority: 'success' },
      { time: new Date(Date.now() - 7200000).toLocaleTimeString(), type: 'gateway', message: 'OnQ gateway started', priority: 'info' },
    ];
    
    const allLogs = [...systemEvents, ...logs].sort((a, b) => {
      return new Date(`2026-04-03 ${b.time}`) - new Date(`2026-04-03 ${a.time}`);
    }).slice(0, 15);
    
    res.status(200).json(allLogs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
