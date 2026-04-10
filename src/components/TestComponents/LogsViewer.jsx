import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Dashboard/Dashboard.css';

export default function LogsViewer() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('slow');
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let endpoint = activeTab === 'slow' ? '/api/traces/slow' : '/api/traces/errors';
      const res = await fetch(endpoint);
      const data = await res.json();
      setLogs(data.traces || data || []);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [activeTab]);

  const formatDuration = (ms) => {
    if (!ms) return '0ms';
    if (ms < 1000) return `${ms.toFixed(2)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Logs Viewer</h1>
        <div className="dashboard-actions">
          <button onClick={() => navigate('/dashboard')} className="refresh-btn">
            Back to Dashboard
          </button>
        </div>
      </header>

      <div className="metrics-grid">
        <div className="metrics-card">
          <div className="metrics-card-title">Active Tab</div>
          <div className="metrics-card-value">{activeTab === 'slow' ? 'Slow Traces' : 'Error Traces'}</div>
        </div>
        <div className="metrics-card">
          <div className="metrics-card-title">Total Logs</div>
          <div className="metrics-card-value">{logs.length}</div>
        </div>
        <div className="metrics-card">
          <div className="metrics-card-title">Slow Traces</div>
          <div className="metrics-card-value">
            {logs.filter(l => l.status === 'ok').length}
          </div>
        </div>
        <div className="metrics-card">
          <div className="metrics-card-title">Error Traces</div>
          <div className="metrics-card-value">
            {logs.filter(l => l.status !== 'ok').length}
          </div>
        </div>
      </div>

      <div className="test-form-card">
        <h3>Filter Logs</h3>
        <div className="test-form">
          <div className="logs-tabs">
            <button 
              className={activeTab === 'slow' ? 'active' : ''} 
              onClick={() => setActiveTab('slow')}
            >
              Slow Traces
            </button>
            <button 
              className={activeTab === 'error' ? 'active' : ''} 
              onClick={() => setActiveTab('error')}
            >
              Error Traces
            </button>
          </div>
          <button onClick={fetchLogs} className="refresh-btn" disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="results-section">
        <h3>Log Entries</h3>
        {loading ? (
          <div className="empty-state">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="empty-state">No logs found</div>
        ) : (
          <table className="modal-table">
            <thead>
              <tr>
                <th>Trace ID</th>
                <th>Operation</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, idx) => (
                <tr key={idx}>
                  <td><code>{log.traceId?.substring(0, 8) || 'N/A'}...</code></td>
                  <td>{log.operationName || 'Unknown'}</td>
                  <td>{formatDuration(log.duration)}</td>
                  <td>
                    <span className={`status-badge ${log.status === 'ok' ? 'success' : 'danger'}`}>
                      {log.status || 'unknown'}
                    </span>
                  </td>
                  <td>{log.startTime ? new Date(log.startTime).toLocaleString() : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <footer className="dashboard-footer">
        <p>Distributed Tracing System &copy; 2026 | Logs Viewer</p>
      </footer>
    </div>
  );
}
