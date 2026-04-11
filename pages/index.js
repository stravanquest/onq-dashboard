import { useEffect, useMemo, useState } from 'react';

const formatTime = (value) => {
  if (!value) return 'n/a';
  try {
    return new Date(value).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  } catch {
    return value;
  }
};

const formatRelativeAge = (value) => {
  if (!value) return 'n/a';
  const when = new Date(value).getTime();
  if (Number.isNaN(when)) return 'n/a';
  const diff = Math.max(0, Date.now() - when);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const formatRelativeTime = (value) => {
  if (!value) return 'n/a';
  const when = new Date(value).getTime();
  if (Number.isNaN(when)) return 'n/a';
  const diff = when - Date.now();
  const minutes = Math.round(Math.abs(diff) / 60000);
  if (minutes < 1) return diff >= 0 ? 'now' : 'just now';
  if (minutes < 60) return diff >= 0 ? `in ${minutes}m` : `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return diff >= 0 ? `in ${hours}h` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return diff >= 0 ? `in ${days}d` : `${days}d ago`;
};

const statusRank = (status) => {
  if (status === 'critical') return 0;
  if (status === 'warning') return 1;
  return 2;
};

const pillTone = (status) => {
  if (status === 'critical') return 'critical';
  if (status === 'warning') return 'warning';
  return 'ok';
};

export default function Dashboard() {
  const [time, setTime] = useState(null);
  const [isCompact, setIsCompact] = useState(false);
  const [dailyLogs, setDailyLogs] = useState([]);
  const [logsUpdatedAt, setLogsUpdatedAt] = useState('');
  const [logsFolderUrl, setLogsFolderUrl] = useState('');
  const [todayFocus, setTodayFocus] = useState([]);
  const [focusUpdatedAt, setFocusUpdatedAt] = useState('');
  const [usage, setUsage] = useState([]);
  const [usageUpdatedAt, setUsageUpdatedAt] = useState('');
  const [usageStateExists, setUsageStateExists] = useState(true);
  const [usageThresholds, setUsageThresholds] = useState({ warning: 65, switchAt: 80 });
  const [usageMemory, setUsageMemory] = useState(null);
  const [modelInfo, setModelInfo] = useState({ current_model: 'loading...', provider: '', fallbacks: [] });
  const [opsStatus, setOpsStatus] = useState(null);
  const [cronStatus, setCronStatus] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadDashboardData = async () => {
    const fetchJson = async (path) => {
      const bust = `${path}${path.includes('?') ? '&' : '?'}v=${Date.now()}`;
      const res = await fetch(bust, { cache: 'no-store' });
      if (!res.ok) return null;
      return res.json();
    };

    setIsRefreshing(true);
    try {
      const logsJson = await fetchJson('/daily-logs/index.json');
      if (logsJson) {
        setDailyLogs(logsJson.entries || []);
        setLogsUpdatedAt(logsJson.updated_at || '');
        setLogsFolderUrl(logsJson.dropbox_folder_url || '');
      }
    } catch (e) {
      console.error('Failed to load daily logs index', e);
    }

    try {
      const focusJson = await fetchJson('/today-focus.json');
      if (focusJson) {
        setTodayFocus(focusJson.items || []);
        setFocusUpdatedAt(focusJson.updated_at || '');
      }
    } catch (e) {
      console.error('Failed to load today focus', e);
    }

    try {
      const usageJson = await fetchJson('/usage.json');
      if (usageJson) {
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
      const modelJson = await fetchJson('/model-info.json');
      if (modelJson) {
        setModelInfo(modelJson);
      }
    } catch (e) {
      console.error('Failed to load model info', e);
    }

    try {
      const memoryJson = await fetchJson('/usage-memory.json');
      if (memoryJson) {
        setUsageMemory(memoryJson);
      }
    } catch (e) {
      console.error('Failed to load usage memory', e);
    }

    try {
      const opsJson = await fetchJson('/ops-status.json');
      if (opsJson) {
        setOpsStatus(opsJson);
      }
    } catch (e) {
      console.error('Failed to load ops status', e);
    }

    try {
      const cronJson = await fetchJson('/cron-status.json');
      if (cronJson) {
        setCronStatus(cronJson);
      }
    } catch (e) {
      console.error('Failed to load cron status', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    const updateCompact = () => setIsCompact(window.innerWidth < 720);
    updateCompact();
    window.addEventListener('resize', updateCompact);

    loadDashboardData();
    const refresher = setInterval(loadDashboardData, 10 * 60 * 1000);

    return () => {
      clearInterval(timer);
      clearInterval(refresher);
      window.removeEventListener('resize', updateCompact);
    };
  }, []);

  const recentLogs = useMemo(() => dailyLogs.slice(0, 4), [dailyLogs]);

  const launchdJobs = useMemo(() => {
    if (!opsStatus?.launchd) return [];
    return Object.values(opsStatus.launchd).filter(Boolean).sort((a, b) => statusRank(a.last_exit === 0 ? 'ok' : 'warning') - statusRank(b.last_exit === 0 ? 'ok' : 'warning'));
  }, [opsStatus]);

  const backupCards = useMemo(() => {
    const items = [];
    const essential = opsStatus?.backups?.essential;
    const arlanne = opsStatus?.backups?.arlanne;
    if (essential) items.push({ label: 'OnQ essential', data: essential });
    if (arlanne) items.push({ label: 'Arlanne SmartPMP', data: arlanne });
    return items;
  }, [opsStatus]);

  const cronJobs = useMemo(() => {
    if (!cronStatus?.jobs) return [];
    return [...cronStatus.jobs].sort((a, b) => {
      const rankA = statusRank(a.status === 'failed' || a.status === 'overdue' ? 'warning' : a.status === 'running' ? 'ok' : a.status === 'paused' ? 'warning' : 'ok');
      const rankB = statusRank(b.status === 'failed' || b.status === 'overdue' ? 'warning' : b.status === 'running' ? 'ok' : b.status === 'paused' ? 'warning' : 'ok');
      if (rankA !== rankB) return rankA - rankB;
      return (new Date(a.next_run_at || 0).getTime()) - (new Date(b.next_run_at || 0).getTime());
    });
  }, [cronStatus]);

  const cronCounts = cronStatus?.counts || { total: 0, enabled: 0, paused: 0, running: 0, waiting: 0, overdue: 0, failed: 0 };

  const alerts = useMemo(() => {
    const list = [];

    if (!usageStateExists) {
      list.push({ level: 'warning', text: 'Usage tracker state file is missing, so usage is being shown honestly instead of guessed.' });
    }

    backupCards.forEach(({ label, data }) => {
      if (data?.status && data.status !== 'ok') {
        list.push({
          level: data.status,
          text: `${label} backup mirror is ${data.status}.`,
        });
      }
      if (data?.local_latest?.name && data?.dropbox_latest?.name && data.local_latest.name !== data.dropbox_latest.name) {
        list.push({
          level: 'warning',
          text: `${label} local and Dropbox latest files do not match exactly.`,
        });
      }
    });

    const staleJobs = launchdJobs.filter((job) => job.last_exit !== 0);
    staleJobs.forEach((job) => {
      list.push({ level: 'warning', text: `${job.label} last exit was ${job.last_exit}.` });
    });

    if (dailyLogs.length === 0) {
      list.push({ level: 'warning', text: 'No daily logs indexed yet.' });
    }

    return list.slice(0, 6);
  }, [usageStateExists, backupCards, launchdJobs, dailyLogs.length]);

  const overallStatus = useMemo(() => {
    const statuses = [];
    if (usageStateExists) statuses.push('ok'); else statuses.push('warning');
    if (opsStatus?.gateway?.status === 'running') statuses.push('ok'); else statuses.push('warning');
    if (backupCards.length > 0) statuses.push(...backupCards.map((b) => b.data?.status || 'warning'));
    if (launchdJobs.some((job) => job.last_exit && job.last_exit !== 0)) statuses.push('warning');
    if ((cronCounts.overdue || 0) > 0 || (cronCounts.failed || 0) > 0) statuses.push('warning');
    const rank = Math.min(...statuses.map(statusRank), 2);
    if (rank === 0) return { label: 'Green', tone: 'ok', note: 'Core systems look healthy.' };
    if (rank === 1) return { label: 'Yellow', tone: 'warning', note: 'Some items need attention.' };
    return { label: 'Red', tone: 'critical', note: 'Something important is not healthy.' };
  }, [usageStateExists, opsStatus, backupCards, launchdJobs, cronCounts]);

  const totalUsageCost = useMemo(() => usage.reduce((sum, p) => sum + (p.cost || 0), 0), [usage]);
  const totalUsageTokens = useMemo(() => usage.reduce((sum, p) => sum + (p.tokens || 0), 0), [usage]);
  const topUsage = useMemo(() => [...usage].sort((a, b) => (b.percent || 0) - (a.percent || 0)).slice(0, 3), [usage]);
  const latestBackupTime = useMemo(() => {
    const candidates = backupCards.flatMap(({ data }) => [data?.local_latest?.mtime, data?.dropbox_latest?.mtime]).filter(Boolean);
    if (candidates.length === 0) return null;
    return candidates.sort().slice(-1)[0];
  }, [backupCards]);
  const executiveSummary = useMemo(() => {
    const healthyLaunchd = launchdJobs.filter((job) => job.last_exit === 0).length;
    const topProvider = topUsage[0];
    return [
      {
        label: 'System posture',
        value: overallStatus.label,
        detail: overallStatus.note,
      },
      {
        label: 'Operational continuity',
        value: `${dailyLogs.length} logs • ${healthyLaunchd}/${launchdJobs.length || 0} healthy`,
        detail: latestBackupTime ? `Latest backup ${formatRelativeAge(latestBackupTime)}` : 'Backup freshness unavailable',
      },
      {
        label: 'Model & usage',
        value: modelInfo.current_model || 'n/a',
        detail: `${usageStateExists ? 'Live usage present' : 'Historical fallback active'} • ${topProvider ? `${topProvider.label} ${topProvider.percent}%` : 'usage snapshot unavailable'}`,
      },
    ];
  }, [overallStatus, launchdJobs, dailyLogs.length, latestBackupTime, topUsage, modelInfo.current_model, usageStateExists]);
  const quickMetrics = useMemo(() => [
    { label: 'Open alerts', value: alerts.length, detail: alerts.length ? 'Needs attention' : 'All clear' },
    { label: 'Healthy launchd jobs', value: launchdJobs.filter((job) => job.last_exit === 0).length, detail: `${launchdJobs.length} tracked` },
    { label: 'Usage at switch point', value: usage.filter((p) => (p.percent || 0) >= (usageThresholds.switchAt || 80)).length, detail: `Warn at ${usageThresholds.warning}%` },
    { label: 'Backup freshness', value: latestBackupTime ? formatRelativeAge(latestBackupTime) : 'n/a', detail: 'Latest mirror timestamp' },
  ], [alerts.length, launchdJobs, usage, usageThresholds, latestBackupTime]);
  const ui = useMemo(() => ({
    ...s,
    page: {
      ...s.page,
      padding: isCompact ? '16px 12px 24px' : s.page.padding,
    },
    header: {
      ...s.header,
      padding: isCompact ? '16px 14px 14px' : s.header.padding,
    },
    headerTop: {
      ...s.headerTop,
      flexDirection: isCompact ? 'column' : s.headerTop.flexDirection,
      alignItems: isCompact ? 'stretch' : s.headerTop.alignItems,
    },
    title: {
      ...s.title,
      fontSize: isCompact ? '1.65rem' : s.title.fontSize,
    },
    subtitle: {
      ...s.subtitle,
      fontSize: isCompact ? '0.92rem' : s.subtitle.fontSize,
    },
    clockBox: {
      ...s.clockBox,
      width: isCompact ? '100%' : undefined,
      minWidth: isCompact ? 0 : s.clockBox.minWidth,
      textAlign: isCompact ? 'left' : s.clockBox.textAlign,
    },
    statusStrip: {
      ...s.statusStrip,
      flexDirection: isCompact ? 'column' : s.statusStrip.flexDirection,
    },
    executiveGrid: {
      ...s.executiveGrid,
      gridTemplateColumns: isCompact ? '1fr' : s.executiveGrid.gridTemplateColumns,
      gap: isCompact ? '12px' : s.executiveGrid.gap,
    },
    executiveCard: {
      ...s.executiveCard,
      padding: isCompact ? '16px' : s.executiveCard.padding,
    },
    executiveLabel: {
      ...s.executiveLabel,
      fontSize: isCompact ? '0.77rem' : s.executiveLabel.fontSize,
    },
    executiveValue: {
      ...s.executiveValue,
      fontSize: isCompact ? '1.35rem' : s.executiveValue.fontSize,
    },
    executiveDetail: {
      ...s.executiveDetail,
      fontSize: isCompact ? '0.82rem' : s.executiveDetail.fontSize,
    },
    metricsGrid: {
      ...s.metricsGrid,
      gridTemplateColumns: isCompact ? '1fr' : s.metricsGrid.gridTemplateColumns,
      gap: isCompact ? '12px' : s.metricsGrid.gap,
    },
    metricCard: {
      ...s.metricCard,
      padding: isCompact ? '14px' : s.metricCard.padding,
    },
    metricLabel: {
      ...s.metricLabel,
      fontSize: isCompact ? '0.77rem' : s.metricLabel.fontSize,
    },
    metricValue: {
      ...s.metricValue,
      fontSize: isCompact ? '1.45rem' : s.metricValue.fontSize,
    },
    metricDetail: {
      ...s.metricDetail,
      fontSize: isCompact ? '0.82rem' : s.metricDetail.fontSize,
    },
    main: {
      ...s.main,
      gap: isCompact ? '14px' : s.main.gap,
    },
    grid4: {
      ...s.grid4,
      gridTemplateColumns: isCompact ? '1fr' : s.grid4.gridTemplateColumns,
      gap: isCompact ? '14px' : s.grid4.gap,
    },
    grid2: {
      ...s.grid2,
      gridTemplateColumns: isCompact ? '1fr' : s.grid2.gridTemplateColumns,
      gap: isCompact ? '14px' : s.grid2.gap,
    },
    card: {
      ...s.card,
      padding: isCompact ? '16px' : s.card.padding,
    },
    cardWide: {
      ...s.cardWide,
      padding: isCompact ? '16px' : s.cardWide.padding,
    },
    bigStat: {
      ...s.bigStat,
      fontSize: isCompact ? '1.7rem' : s.bigStat.fontSize,
    },
    bigText: {
      ...s.bigText,
      fontSize: isCompact ? '1rem' : s.bigText.fontSize,
    },
    statRow: {
      ...s.statRow,
      flexDirection: isCompact ? 'column' : s.statRow.flexDirection,
      alignItems: isCompact ? 'flex-start' : 'center',
    },
    barHead: {
      ...s.barHead,
      flexDirection: isCompact ? 'column' : s.barHead.flexDirection,
    },
    memoryHead: {
      ...s.memoryHead,
      flexDirection: isCompact ? 'column' : s.memoryHead.flexDirection,
    },
    sectionHead: {
      ...s.sectionHead,
      flexDirection: isCompact ? 'column' : s.sectionHead.flexDirection,
    },
    logGrid: {
      ...s.logGrid,
      gridTemplateColumns: isCompact ? '1fr' : s.logGrid.gridTemplateColumns,
    },
    logCard: {
      ...s.logCard,
      padding: isCompact ? '12px' : s.logCard.padding,
    },
    footerRow: {
      ...s.footerRow,
      flexDirection: isCompact ? 'column' : s.footerRow.flexDirection,
      alignItems: isCompact ? 'flex-start' : 'center',
    },
    focusList: {
      ...s.focusList,
      paddingLeft: isCompact ? '20px' : s.focusList.paddingLeft,
    },
    summaryList: {
      ...s.summaryList,
      gap: isCompact ? '6px' : s.summaryList.gap,
    },
  }), [isCompact]);

  return (
    <div style={ui.page}>
      <header style={ui.header}>
        <div style={ui.headerTop}>
          <div>
            <div style={ui.kicker}>OnQ Control Center</div>
            <h1 style={ui.title}>Chris’s operations dashboard</h1>
            <div style={ui.subtitle}>Live operational view.</div>
          </div>
          <div style={ui.clockBox}>
            <div style={ui.clockDate}>{time ? time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : 'Loading clock...'}</div>
            <div style={ui.clockTime}>{time ? time.toLocaleTimeString('en-US') : '...'}</div>
          </div>
        </div>

        <div style={ui.statusStrip}>
          <div style={ui.statusChip(statusRank(overallStatus.tone) === 0 ? 'ok' : overallStatus.tone)}>
            Overall: {overallStatus.label}
          </div>
          <div style={ui.statusChip(opsStatus?.gateway?.status === 'running' ? 'ok' : 'warning')}>
            Gateway: {opsStatus?.gateway?.status === 'running' ? 'running' : 'unknown'}
          </div>
          <div style={ui.statusChip(usageStateExists ? 'ok' : 'warning')}>
            Usage state: {usageStateExists ? 'present' : 'missing'}
          </div>
          <div style={ui.statusChip('ok')}>
            Model: {modelInfo.current_model || 'unknown'}
          </div>
          <div style={ui.statusChip(backupCards.some((b) => b.data?.status === 'warning' || b.data?.status === 'critical') ? 'warning' : 'ok')}>
            Backups: {backupCards.length ? 'indexed' : 'not indexed'}
          </div>
          <button onClick={loadDashboardData} style={ui.refreshButton} disabled={isRefreshing}>
            {isRefreshing ? 'Refreshing...' : 'Refresh now'}
          </button>
        </div>

        <div style={ui.noteLine}>{overallStatus.note}</div>
      </header>

      <section style={ui.executiveGrid}>
        {executiveSummary.map((item) => (
          <div key={item.label} style={ui.executiveCard}>
            <div style={ui.executiveLabel}>{item.label}</div>
            <div style={ui.executiveValue}>{item.value}</div>
            <div style={ui.executiveDetail}>{item.detail}</div>
          </div>
        ))}
      </section>

      <section style={ui.metricsGrid}>
        {quickMetrics.map((metric) => (
          <div key={metric.label} style={ui.metricCard}>
            <div style={ui.metricLabel}>{metric.label}</div>
            <div style={ui.metricValue}>{metric.value}</div>
            <div style={ui.metricDetail}>{metric.detail}</div>
          </div>
        ))}
      </section>

      <main style={ui.main}>
        <section style={ui.grid4}>
          <div style={ui.card}>
            <div style={ui.cardTitle}>Health at a glance</div>
            <div style={ui.bigStat}>{overallStatus.label}</div>
            <div style={ui.statRow}><span>Gateway</span><strong>{opsStatus?.gateway?.status === 'running' ? 'Running' : 'Unknown'}</strong></div>
            <div style={ui.statRow}><span>Launchd jobs tracked</span><strong>{launchdJobs.length}</strong></div>
            <div style={ui.statRow}><span>Daily logs indexed</span><strong>{dailyLogs.length}</strong></div>
            <div style={ui.statRow}><span>Cron jobs tracked</span><strong>{cronCounts.total || 0}</strong></div>
            <div style={ui.statRow}><span>Today focus items</span><strong>{todayFocus.length}</strong></div>
          </div>

          <div style={ui.card}>
            <div style={ui.cardTitle}>Usage</div>
            {!usageStateExists ? (
              <>
                <div style={ui.warnBox}>Usage tracker state file is missing.</div>
                <div style={ui.muted}>Expected source: ~/.hermes/usage_tracker_state.json</div>
                <div style={ui.muted}>Updated: {usageUpdatedAt || 'n/a'}</div>
              </>
            ) : usage.length === 0 ? (
              <div style={ui.muted}>Usage snapshot unavailable.</div>
            ) : (
              <>
                {topUsage.map((p) => (
                  <div key={p.key} style={ui.barWrap}>
                    <div style={ui.barHead}>
                      <span>{p.label}</span>
                      <strong style={ui.statusText(p.status)}>{p.percent}%</strong>
                    </div>
                    <div style={ui.barTrack}>
                      <div style={{ ...ui.barFill, width: `${Math.min(100, p.percent || 0)}%`, background: p.status === 'critical' ? '#ef4444' : p.status === 'warning' ? '#f59e0b' : '#22c55e' }} />
                    </div>
                  </div>
                ))}
                <div style={ui.muted}>{totalUsageTokens.toLocaleString()} tokens used • ${(totalUsageCost || 0).toFixed(4)} est.</div>
                <div style={ui.muted}>Thresholds: warn {usageThresholds.warning}% • switch {usageThresholds.switchAt}%</div>
              </>
            )}
            {usageStateExists ? null : usageMemory?.providers?.length ? (
              <div style={ui.memoryBox}>
                <div style={ui.memoryTitle}>Last known usage from backup</div>
                <div style={ui.muted}>This is historical, not live current usage.</div>
                {usageMemory.providers.map((p) => (
                  <div key={p.key} style={ui.memoryRow}>
                    <div style={ui.memoryHead}>
                      <span>{p.label}</span>
                      <strong>{p.lifetime_tokens.toLocaleString()} tokens</strong>
                    </div>
                    <div style={ui.muted}>{p.lifetime_messages} messages • last seen {p.last_seen ? new Date(p.last_seen).toLocaleString('en-US') : 'n/a'}</div>
                  </div>
                ))}
                <div style={ui.muted}>Snapshot backup: {usageMemory.source_backup_mtime ? new Date(usageMemory.source_backup_mtime).toLocaleString('en-US') : 'n/a'}</div>
              </div>
            ) : null}
          </div>

          <div style={ui.card}>
            <div style={ui.cardTitle}>Model</div>
            <div style={ui.bigText}>{modelInfo.current_model || 'n/a'}</div>
            <div style={ui.statRow}><span>Provider</span><strong>{modelInfo.provider || 'n/a'}</strong></div>
            <div style={ui.statRow}><span>Window</span><strong>{modelInfo.window_hours || 8}h rolling</strong></div>
            <div style={ui.statRow}><span>Fallbacks</span><strong>{modelInfo.fallbacks?.length ? modelInfo.fallbacks.join(' → ') : 'n/a'}</strong></div>
            <div style={ui.muted}>Updated: {modelInfo.updated_at ? formatTime(modelInfo.updated_at) : 'n/a'}</div>
          </div>

          <div style={ui.card}>
            <div style={ui.cardTitle}>Backups</div>
            {backupCards.length === 0 ? (
              <div style={ui.muted}>Backup data not indexed yet.</div>
            ) : (
              backupCards.map(({ label, data }) => (
                <div key={label} style={ui.backupBlock}>
                  <div style={ui.barHead}>
                    <span>{label}</span>
                    <strong style={ui.statusText(data.status)}>{data.status || 'unknown'}</strong>
                  </div>
                  <div style={ui.muted}>Local: {data.local_latest?.name || 'none'}</div>
                  <div style={ui.muted}>Dropbox: {data.dropbox_latest?.name || 'none'}</div>
                </div>
              ))
            )}
            {opsStatus?.updated_at ? <div style={ui.muted}>Indexed: {formatTime(opsStatus.updated_at)}</div> : null}
          </div>
        </section>

        <section style={ui.cardWide}>
          <div style={ui.sectionHead}>
            <div>
              <div style={ui.cardTitle}>Cron jobs</div>
              <div style={ui.muted}>Scheduled jobs from ~/.hermes/cron/jobs.json. This is the missing spot you asked for.</div>
            </div>
            <div style={ui.smallTag}>{cronCounts.total || 0} total</div>
          </div>
          <div style={ui.cronStatsGrid}>
            <div style={ui.metricCard}>
              <div style={ui.metricLabel}>Waiting to run</div>
              <div style={ui.metricValue}>{cronCounts.waiting || 0}</div>
              <div style={ui.metricDetail}>Jobs queued and waiting for their slot</div>
            </div>
            <div style={ui.metricCard}>
              <div style={ui.metricLabel}>Overdue</div>
              <div style={ui.metricValue}>{cronCounts.overdue || 0}</div>
              <div style={ui.metricDetail}>Due already and not yet run</div>
            </div>
            <div style={ui.metricCard}>
              <div style={ui.metricLabel}>Paused</div>
              <div style={ui.metricValue}>{cronCounts.paused || 0}</div>
              <div style={ui.metricDetail}>Disabled or intentionally stopped</div>
            </div>
            <div style={ui.metricCard}>
              <div style={ui.metricLabel}>Enabled</div>
              <div style={ui.metricValue}>{cronCounts.enabled || 0}</div>
              <div style={ui.metricDetail}>Currently allowed to fire</div>
            </div>
          </div>
          <div style={ui.cronList}>
            {(cronJobs.length ? cronJobs : []).slice(0, 6).map((job) => (
              <div key={job.id} style={ui.cronRow}>
                <div style={ui.cronLeft}>
                  <div style={ui.cronName}>{job.name}</div>
                  <div style={ui.muted}>{job.schedule_display} • {job.enabled ? 'enabled' : 'disabled'}{job.repeat_completed != null ? ` • ran ${job.repeat_completed}x` : ''}</div>
                </div>
                <div style={ui.cronRight}>
                  <div style={ui.statusChip(pillTone(job.status === 'failed' || job.status === 'overdue' ? 'warning' : job.status === 'paused' ? 'warning' : job.status === 'running' ? 'ok' : 'ok'))}>
                    {job.status_label}
                  </div>
                  <div style={ui.muted}>{job.detail}</div>
                </div>
              </div>
            ))}
            {cronJobs.length === 0 ? <div style={ui.muted}>Cron snapshot unavailable.</div> : null}
          </div>
          {cronStatus?.updated_at ? <div style={ui.muted}>Indexed: {formatTime(cronStatus.updated_at)}</div> : null}
        </section>

        <section style={ui.cardWide}>
          <div style={ui.sectionHead}>
            <div>
              <div style={ui.cardTitle}>Active alerts</div>
              <div style={ui.muted}>Open items requiring attention.</div>
            </div>
            <div style={ui.smallTag}>{alerts.length} open</div>
          </div>
          {alerts.length === 0 ? (
            <div style={ui.goodLine}>No current alerts. Rare, but nice.</div>
          ) : (
            <div style={ui.alertList}>
              {alerts.map((a, idx) => (
                <div key={idx} style={ui.alertItem(a.level)}>
                  <span style={ui.alertDot(a.level)} />
                  <span>{a.text}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section style={ui.cardWide}>
          <div style={ui.sectionHead}>
            <div>
              <div style={ui.cardTitle}>Recent daily logs</div>
              <div style={ui.muted}>Showing the latest 4 logs. The full archive stays in the folder.</div>
            </div>
            <div style={ui.smallTag}>{dailyLogs.length} total</div>
          </div>
          {recentLogs.length === 0 ? (
            <div style={ui.muted}>No logs indexed yet.</div>
          ) : (
            <div style={ui.logGrid}>
              {recentLogs.map((entry) => (
                <div key={entry.path} style={ui.logCard}>
                  <div style={ui.logDate}>{entry.date}</div>
                  <div style={ui.logTitle}>{entry.title}</div>
                  <a href={entry.path} target="_blank" rel="noreferrer" style={ui.logButton}>Open log</a>
                </div>
              ))}
            </div>
          )}
          <div style={ui.footerRow}>
            <div style={ui.muted}>Index updated: {logsUpdatedAt || 'n/a'}</div>
            {logsFolderUrl ? (
              <a href={logsFolderUrl} target="_blank" rel="noreferrer" style={ui.linkButton}>Open full Dropbox log folder</a>
            ) : null}
          </div>
        </section>

        <section style={ui.grid2}>
          <div style={ui.cardWide}>
            <div style={ui.sectionHead}>
              <div>
                <div style={ui.cardTitle}>Today’s focus</div>
                <div style={ui.muted}>The three things that matter most right now.</div>
              </div>
              <div style={ui.smallTag}>{focusUpdatedAt ? formatTime(focusUpdatedAt) : 'n/a'}</div>
            </div>
            {todayFocus.length === 0 ? (
              <div style={ui.muted}>No focus items loaded.</div>
            ) : (
              <ol style={ui.focusList}>
                {todayFocus.map((item) => (
                  <li key={item.title} style={ui.focusItem}>
                    <div style={ui.focusTitle}>{item.title}</div>
                    <div style={ui.focusDetail}>{item.detail}</div>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div style={ui.cardWide}>
            <div style={ui.cardTitle}>Operational summary</div>
            <div style={ui.summaryList}>
              <div style={ui.statRow}><span>Gateway</span><strong>{opsStatus?.gateway?.status === 'running' ? `Running (PID ${opsStatus.gateway.pid})` : 'Unknown'}</strong></div>
              <div style={ui.statRow}><span>Launchd backups</span><strong>{launchdJobs.filter((job) => job.label.includes('backup')).length}</strong></div>
              <div style={ui.statRow}><span>Logs</span><strong>{dailyLogs.length > 0 ? 'Indexed' : 'Missing'}</strong></div>
              <div style={ui.statRow}><span>Usage state</span><strong>{usageStateExists ? 'Present' : 'Missing'}</strong></div>
              <div style={ui.statRow}><span>Model</span><strong>{modelInfo.current_model || 'n/a'}</strong></div>
            </div>
            <div style={ui.muted}>Built for Chris by Q.</div>
          </div>
        </section>
      </main>
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #0b1220 0%, #111827 45%, #0f172a 100%)',
    color: '#e5e7eb',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif',
    padding: '28px 22px 40px',
  },
  header: {
    maxWidth: '1280px',
    margin: '0 auto 22px',
    padding: '20px 20px 16px',
    background: 'rgba(15, 23, 42, 0.82)',
    border: '1px solid rgba(148, 163, 184, 0.18)',
    borderRadius: '18px',
    boxShadow: '0 22px 60px rgba(0,0,0,0.35)',
    backdropFilter: 'blur(10px)',
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  kicker: {
    color: '#93c5fd',
    textTransform: 'uppercase',
    letterSpacing: '0.18em',
    fontSize: '0.72rem',
    marginBottom: '8px',
    fontWeight: 700,
  },
  title: {
    margin: 0,
    fontSize: '2rem',
    lineHeight: 1.1,
    color: '#f8fafc',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    marginTop: '8px',
    color: '#94a3b8',
    fontSize: '0.98rem',
  },
  clockBox: {
    minWidth: '240px',
    textAlign: 'right',
    padding: '12px 14px',
    background: 'rgba(30, 41, 59, 0.8)',
    borderRadius: '14px',
    border: '1px solid rgba(148, 163, 184, 0.16)',
  },
  clockDate: { color: '#cbd5e1', fontSize: '0.92rem', marginBottom: '4px' },
  clockTime: { color: '#f8fafc', fontSize: '1.4rem', fontWeight: 800, letterSpacing: '0.03em' },
  statusStrip: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    marginTop: '18px',
  },
  executiveGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '12px',
    maxWidth: '1280px',
    margin: '0 auto 12px',
  },
  executiveCard: {
    background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.96), rgba(15, 23, 42, 0.94))',
    border: '1px solid rgba(96, 165, 250, 0.2)',
    borderRadius: '18px',
    padding: '18px',
    boxShadow: '0 18px 38px rgba(0,0,0,0.24)',
  },
  executiveLabel: {
    color: '#bfdbfe',
    textTransform: 'uppercase',
    letterSpacing: '0.14em',
    fontSize: '0.72rem',
    fontWeight: 800,
  },
  executiveValue: {
    marginTop: '8px',
    color: '#f8fafc',
    fontSize: '1.4rem',
    fontWeight: 900,
    lineHeight: 1.08,
  },
  executiveDetail: {
    marginTop: '10px',
    color: '#cbd5e1',
    fontSize: '0.88rem',
    lineHeight: 1.5,
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: '12px',
    maxWidth: '1280px',
    margin: '0 auto',
  },
  metricCard: {
    background: 'rgba(15, 23, 42, 0.92)',
    border: '1px solid rgba(148, 163, 184, 0.14)',
    borderRadius: '16px',
    padding: '16px',
    boxShadow: '0 14px 34px rgba(0,0,0,0.2)',
  },
  metricLabel: {
    color: '#93c5fd',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    fontSize: '0.72rem',
    fontWeight: 800,
  },
  metricValue: {
    marginTop: '8px',
    color: '#f8fafc',
    fontSize: '1.7rem',
    fontWeight: 900,
    lineHeight: 1.05,
  },
  metricDetail: {
    marginTop: '8px',
    color: '#cbd5e1',
    fontSize: '0.86rem',
  },
    statusChip: (tone) => ({
    padding: '8px 12px',
    borderRadius: '999px',
    border: `1px solid ${tone === 'critical' ? 'rgba(248, 113, 113, 0.4)' : tone === 'warning' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(34, 197, 94, 0.35)'}`,
    background: tone === 'critical' ? 'rgba(127, 29, 29, 0.4)' : tone === 'warning' ? 'rgba(120, 53, 15, 0.35)' : 'rgba(20, 83, 45, 0.35)',
    color: tone === 'critical' ? '#fecaca' : tone === 'warning' ? '#fde68a' : '#bbf7d0',
    fontWeight: 700,
    fontSize: '0.86rem',
  }),
  refreshButton: {
    border: '1px solid rgba(96, 165, 250, 0.35)',
    background: 'rgba(37, 99, 235, 0.25)',
    color: '#dbeafe',
    padding: '8px 14px',
    borderRadius: '999px',
    fontWeight: 800,
    fontSize: '0.86rem',
    cursor: 'pointer',
  },
noteLine: {
    marginTop: '14px',
    color: '#cbd5e1',
    fontSize: '0.95rem',
  },
  main: {
    maxWidth: '1280px',
    margin: '0 auto',
    display: 'grid',
    gap: '18px',
  },
  grid4: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '18px',
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '18px',
  },
  card: {
    background: 'rgba(15, 23, 42, 0.92)',
    border: '1px solid rgba(148, 163, 184, 0.14)',
    borderRadius: '18px',
    padding: '18px',
    boxShadow: '0 18px 44px rgba(0,0,0,0.28)',
  },
  cardWide: {
    background: 'rgba(15, 23, 42, 0.92)',
    border: '1px solid rgba(148, 163, 184, 0.14)',
    borderRadius: '18px',
    padding: '18px',
    boxShadow: '0 18px 44px rgba(0,0,0,0.28)',
    gridColumn: '1 / -1',
  },
  cardTitle: {
    color: '#f8fafc',
    fontSize: '1rem',
    fontWeight: 800,
    marginBottom: '14px',
    letterSpacing: '0.01em',
  },
  bigStat: {
    fontSize: '2rem',
    fontWeight: 900,
    color: '#f8fafc',
    marginBottom: '12px',
  },
  bigText: {
    fontSize: '1.1rem',
    fontWeight: 800,
    color: '#f8fafc',
    marginBottom: '10px',
    wordBreak: 'break-word',
  },
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    padding: '8px 0',
    borderBottom: '1px solid rgba(148, 163, 184, 0.12)',
    color: '#dbe4f0',
    fontSize: '0.92rem',
  },
  muted: {
    color: '#94a3b8',
    fontSize: '0.87rem',
    marginTop: '10px',
  },
  warnBox: {
    background: 'rgba(120, 53, 15, 0.35)',
    border: '1px solid rgba(245, 158, 11, 0.35)',
    color: '#fde68a',
    padding: '12px',
    borderRadius: '12px',
    fontWeight: 700,
  },
  goodLine: {
    color: '#bbf7d0',
    fontWeight: 700,
    padding: '6px 0',
  },
  barWrap: {
    marginBottom: '12px',
  },
  barHead: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '6px',
    color: '#dbe4f0',
    fontSize: '0.92rem',
  },
  barTrack: {
    height: '8px',
    borderRadius: '999px',
    background: 'rgba(51, 65, 85, 0.95)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: '999px',
  },
  statusText: (status) => ({
    color: status === 'critical' ? '#fca5a5' : status === 'warning' ? '#fde68a' : '#bbf7d0',
  }),
  backupBlock: {
    paddingBottom: '12px',
    marginBottom: '12px',
    borderBottom: '1px solid rgba(148, 163, 184, 0.12)',
  },
  memoryBox: {
    marginTop: '14px',
    padding: '14px',
    borderRadius: '14px',
    background: 'rgba(2, 6, 23, 0.55)',
    border: '1px solid rgba(59, 130, 246, 0.22)',
  },
  memoryTitle: {
    color: '#bfdbfe',
    fontWeight: 800,
    marginBottom: '8px',
  },
  memoryRow: {
    paddingTop: '10px',
    marginTop: '10px',
    borderTop: '1px solid rgba(148, 163, 184, 0.12)',
  },
  memoryHead: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    color: '#e2e8f0',
    fontSize: '0.92rem',
    fontWeight: 700,
  },
  sectionHead: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    alignItems: 'flex-start',
    marginBottom: '12px',
    flexWrap: 'wrap',
  },
  smallTag: {
    borderRadius: '999px',
    padding: '7px 10px',
    background: 'rgba(30, 41, 59, 0.95)',
    border: '1px solid rgba(148, 163, 184, 0.18)',
    color: '#cbd5e1',
    fontSize: '0.82rem',
    fontWeight: 700,
  },
  cronStatsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
    gap: '12px',
    marginBottom: '14px',
  },
  cronList: {
    display: 'grid',
    gap: '10px',
  },
  cronRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '14px',
    padding: '12px 0',
    borderTop: '1px solid rgba(148, 163, 184, 0.12)',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  cronLeft: {
    minWidth: '220px',
    flex: '1 1 360px',
  },
  cronRight: {
    minWidth: '220px',
    flex: '0 1 320px',
    display: 'grid',
    gap: '6px',
    justifyItems: 'start',
  },
  cronName: {
    color: '#f8fafc',
    fontWeight: 800,
    fontSize: '0.95rem',
  },
  alertList: {
    display: 'grid',
    gap: '10px',
  },
  alertItem: (level) => ({
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-start',
    padding: '10px 12px',
    borderRadius: '12px',
    background: level === 'critical' ? 'rgba(127, 29, 29, 0.34)' : level === 'warning' ? 'rgba(120, 53, 15, 0.28)' : 'rgba(20, 83, 45, 0.28)',
    border: `1px solid ${level === 'critical' ? 'rgba(248, 113, 113, 0.34)' : level === 'warning' ? 'rgba(245, 158, 11, 0.34)' : 'rgba(34, 197, 94, 0.3)'}`,
    color: '#e2e8f0',
    lineHeight: 1.45,
  }),
  alertDot: (level) => ({
    width: '10px',
    height: '10px',
    borderRadius: '999px',
    marginTop: '4px',
    flex: '0 0 10px',
    background: level === 'critical' ? '#f87171' : level === 'warning' ? '#f59e0b' : '#22c55e',
  }),
  logGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '12px',
  },
  logCard: {
    background: 'rgba(30, 41, 59, 0.82)',
    border: '1px solid rgba(148, 163, 184, 0.16)',
    borderRadius: '14px',
    padding: '14px',
    display: 'grid',
    gap: '8px',
  },
  logDate: {
    color: '#93c5fd',
    fontSize: '0.82rem',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  logTitle: {
    color: '#f8fafc',
    fontWeight: 800,
  },
  logButton: {
    display: 'inline-block',
    marginTop: '4px',
    textDecoration: 'none',
    color: '#e2e8f0',
    background: '#1d4ed8',
    padding: '8px 12px',
    borderRadius: '10px',
    fontWeight: 800,
    width: 'fit-content',
  },
  footerRow: {
    marginTop: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  linkButton: {
    textDecoration: 'none',
    color: '#bfdbfe',
    border: '1px solid rgba(147, 197, 253, 0.3)',
    padding: '8px 12px',
    borderRadius: '10px',
    fontWeight: 800,
    background: 'rgba(30, 41, 59, 0.8)',
  },
  focusList: {
    margin: 0,
    paddingLeft: '18px',
  },
  focusItem: {
    marginBottom: '14px',
  },
  focusTitle: {
    color: '#f8fafc',
    fontWeight: 800,
    marginBottom: '4px',
  },
  focusDetail: {
    color: '#cbd5e1',
    fontSize: '0.95rem',
  },
  summaryList: {
    display: 'grid',
    gap: '2px',
    marginBottom: '12px',
  },
};
