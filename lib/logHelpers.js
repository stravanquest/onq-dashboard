export function getLogPriorityColor(type) {
  const colors = {
    'success': '#28a745',
    'error': '#dc3545',
    'warning': '#ffc107',
    'info': '#17a2b8',
    'backup': '#28a745',
    'gateway': '#17a2b8',
    'api_call': '#667eea',
    'system': '#6c757d',
  };
  return colors[type] || '#667eea';
}

export function getLogIcon(type) {
  const icons = {
    'success': '✅',
    'error': '❌',
    'warning': '⚠️',
    'info': 'ℹ️',
    'backup': '🛡️',
    'gateway': '🔄',
    'api_call': '📡',
    'system': '🤖',
  };
  return icons[type] || '📝';
}
