# 🤖 OnQ Dashboard

Chris's AI Operations Control Center

## Deploy to Vercel

1. Push this repo to GitHub (under stravan.quest)
2. Go to vercel.com
3. Click "New Project"
4. Import this repo
5. Click "Deploy"

## Features

- Live API usage tracking
- Backup status
- Agent status (OnQ, Arlanne, OpenClaw)
- Auto-refresh every 30 seconds
- Mobile responsive

## Data Sync

The dashboard reads from `/api/usage` which pulls from a JSON file.

Set up a cron job on your Mac to sync usage data:

```bash
# Add to crontab (runs every 5 minutes)
*/5 * * * * /Users/visualriot/.onq/scripts/sync-to-vercel.sh
```

## Access

Once deployed, access from anywhere:
`https://onq-dashboard-<your-username>.vercel.app`

---

Built for Chris by OnQ ❤️
