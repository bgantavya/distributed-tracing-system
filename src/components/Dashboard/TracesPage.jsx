import { useState } from 'react';
import { useTraces } from '../../hooks/useTraces';
import { useStats } from '../../hooks/useStats';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import RecentTraces from './RecentTraces';
import './Dashboard.css';

export default function TracesPage({ serviceName = 'distributed-tracing-service' }) {
  const { traces, loading, error, refresh } = useTraces(serviceName);
  const { stats, loading: statsLoading } = useStats(serviceName);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const handleRefresh = () => {
    refresh();
    setLastUpdated(new Date());
  };

  useAutoRefresh(handleRefresh, 5000, false);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Recent Traces</h1>
        <div className="dashboard-actions">
          <span className="last-updated">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
          <button onClick={handleRefresh} className="refresh-btn">
            Refresh
          </button>
        </div>
      </header>

      {error && (
        <div className="error-banner">
          Error loading traces: {error}
          <button onClick={handleRefresh}>Retry</button>
        </div>
      )}

      <div className="metrics-grid">
        <MetricsCard
          title="Total Traces"
          value={stats?.totalTraces || 0}
          loading={statsLoading}
          icon="traces"
        />
        <MetricsCard
          title="Avg Duration"
          value={`${(stats?.avgDuration || 0).toFixed(2)}ms`}
          loading={statsLoading}
          icon="duration"
        />
        <MetricsCard
          title="Error Rate"
          value={`${((stats?.errorCount || 0) / (stats?.totalTraces || 1) * 100).toFixed(2)}%`}
          loading={statsLoading}
          icon="errors"
          variant={stats?.errorCount > 0 ? 'danger' : 'success'}
        />
        <MetricsCard
          title="P99 Duration"
          value={`${(stats?.p99Duration || 0).toFixed(2)}ms`}
          loading={statsLoading}
          icon="p99"
        />
      </div>

      <div className="dashboard-content">
        <div className="traces-section">
          <RecentTraces traces={traces} loading={loading} />
        </div>
      </div>

      <footer className="dashboard-footer">
        <p>Distributed Tracing System &copy; 2026 | Recent Traces</p>
      </footer>
    </div>
  );
}

function MetricsCard({ title, value, loading, icon, variant }) {
  return (
    <div className={`metrics-card ${variant || ''}`}>
      <div className="metrics-card-title">{title}</div>
      <div className="metrics-card-value">
        {loading ? '...' : value}
      </div>
    </div>
  );
}
