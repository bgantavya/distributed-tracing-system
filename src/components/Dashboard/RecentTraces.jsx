import { useState } from 'react';
import './Dashboard.css';

const statusColors = {
  ok: 'success',
  error: 'danger',
  client_error: 'warning',
  server_error: 'danger'
};

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 60000).toFixed(2)}m`;
}

function TraceDetailModal({ trace, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="traces-modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2>Trace Details</h2>
        
        <div className="traces-summary-grid">
          <div className="traces-summary-card total">
            <div className="traces-summary-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div className="traces-summary-content">
              <div className="traces-summary-label">Duration</div>
              <div className="traces-summary-value">{formatDuration(trace.duration)}</div>
            </div>
          </div>
          <div className="traces-summary-card success">
            <div className="traces-summary-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div className="traces-summary-content">
              <div className="traces-summary-label">Status</div>
              <div className="traces-summary-value">
                <span className={`status-badge ${statusColors[trace.status]}`}>
                  {trace.status}
                </span>
              </div>
            </div>
          </div>
          <div className="traces-summary-card danger">
            <div className="traces-summary-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
              </svg>
            </div>
            <div className="traces-summary-content">
              <div className="traces-summary-label">HTTP Status</div>
              <div className="traces-summary-value">{trace.httpStatusCode || '-'}</div>
            </div>
          </div>
        </div>

        <div className="traces-modal-table">
          <table className="modal-table">
            <tbody>
              <tr>
                <td className="modal-label">Trace ID</td>
                <td className="modal-value"><code>{trace.traceId}</code></td>
              </tr>
              <tr>
                <td className="modal-label">Span ID</td>
                <td className="modal-value"><code>{trace.spanId}</code></td>
              </tr>
              <tr>
                <td className="modal-label">Operation</td>
                <td className="modal-value">{trace.operationName}</td>
              </tr>
              <tr>
                <td className="modal-label">Service</td>
                <td className="modal-value">{trace.serviceName}</td>
              </tr>
              <tr>
                <td className="modal-label">Process ID</td>
                <td className="modal-value">{trace.processId}</td>
              </tr>
              <tr>
                <td className="modal-label">Start Time</td>
                <td className="modal-value">{new Date(trace.startTime).toLocaleString()}</td>
              </tr>
              <tr>
                <td className="modal-label">End Time</td>
                <td className="modal-value">{new Date(trace.endTime).toLocaleString()}</td>
              </tr>
              {trace.errorMessage && (
                <tr>
                  <td className="modal-label">Error</td>
                  <td className="modal-value error">{trace.errorMessage}</td>
                </tr>
              )}
              {trace.tags && trace.tags.length > 0 && (
                <tr>
                  <td className="modal-label">Tags</td>
                  <td className="modal-value">
                    <div className="tags-list">
                      {trace.tags.map((tag, idx) => (
                        <span key={idx} className="tag-badge">
                          {tag.key}: {String(tag.value)}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function RecentTraces({ traces, loading }) {
  const [selectedTrace, setSelectedTrace] = useState(null);

  if (loading) {
    return <div className="loading">Loading traces...</div>;
  }

  if (traces.length === 0) {
    return <div className="empty-state">No traces found</div>;
  }

  return (
    <>
      <div className="recent-traces-container">
        <table className="traces-table">
          <thead>
            <tr>
              <th>Trace ID</th>
              <th>Operation</th>
              <th>Service</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {traces.slice(0, 20).map((trace) => (
              <tr key={trace.spanId} onClick={() => setSelectedTrace(trace)} style={{ cursor: 'pointer' }}>
                <td className="trace-id">
                  <code>{trace.traceId?.substring(0, 8)}...</code>
                </td>
                <td>{trace.operationName}</td>
                <td>{trace.serviceName}</td>
                <td className="duration">
                  {formatDuration(trace.duration)}
                </td>
                <td>
                  <span className={`status-badge ${statusColors[trace.status]}`}>
                    {trace.status}
                  </span>
                </td>
                <td className="timestamp">
                  {new Date(trace.startTime).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedTrace && (
        <TraceDetailModal trace={selectedTrace} onClose={() => setSelectedTrace(null)} />
      )}
    </>
  );
}
