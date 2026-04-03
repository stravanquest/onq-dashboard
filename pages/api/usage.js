export default function handler(req, res) {
  // This will read from a JSON file that gets synced from your Mac
  // For now, returning demo data
  
  const demoData = {
    usage: {
      openai_codex: { messages: 15, tokens: 125000, pct: 10.0 },
      openrouter: { messages: 48, tokens: 450000, pct: 45.0 }
    },
    backups: {
      onq: '2026-04-03 03:45',
      arlanne: '2026-04-03 03:45'
    },
    agents: {
      onq: true,
      arlanne: true,
      openclaw: true
    }
  };

  res.status(200).json(demoData);
}
