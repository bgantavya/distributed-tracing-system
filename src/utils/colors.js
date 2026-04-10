export const statusColors = {
  ok: {
    bg: 'rgba(40, 167, 69, 0.1)',
    text: '#28a745',
    border: '#28a745'
  },
  error: {
    bg: 'rgba(220, 53, 69, 0.1)',
    text: '#dc3545',
    border: '#dc3545'
  },
  client_error: {
    bg: 'rgba(255, 193, 7, 0.1)',
    text: '#ffc107',
    border: '#ffc107'
  },
  server_error: {
    bg: 'rgba(220, 53, 69, 0.1)',
    text: '#dc3545',
    border: '#dc3545'
  }
};

export function getDurationColor(duration) {
  if (duration < 100) return '#28a745';
  if (duration < 500) return '#ffc107';
  if (duration < 1000) return '#fd7e14';
  return '#dc3545';
}

export function getStatusColor(status) {
  return statusColors[status] || statusColors.ok;
}

export const samplingColors = {
  always: '#28a745',
  error: '#dc3545',
  slow: '#fd7e14',
  very_slow: '#dc3545',
  fast: '#6c757d',
  sampled: '#17a2b8',
  dropped: '#6c757d'
};
