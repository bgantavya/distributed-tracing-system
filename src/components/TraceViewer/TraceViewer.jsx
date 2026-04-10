import { useState } from 'react';
import { Link } from 'react-router-dom';
import './TraceViewer.css';

const dummySpans = [
  { spanId: 'abc123', operationName: 'HTTP GET /api/users', serviceName: 'api-gateway', startTime: 0, duration: 120, status: 'ok' },
  { spanId: 'def456', operationName: 'Database Query', serviceName: 'user-service', startTime: 20, duration: 45, status: 'ok' },
  { spanId: 'ghi789', operationName: 'External API Call', serviceName: 'user-service', startTime: 70, duration: 35, status: 'ok' },
  { spanId: 'jkl012', operationName: 'Cache Lookup', serviceName: 'redis-cache', startTime: 15, duration: 5, status: 'ok' },
  { spanId: 'mno345', operationName: 'Validation', serviceName: 'user-service', startTime: 10, duration: 8, status: 'error' },
];

export default function TraceViewer() {
  const [spans] = useState(dummySpans);
  const [selectedSpan, setSelectedSpan] = useState(null);

  const totalDuration = Math.max(...spans.map(s => s.startTime + s.duration));

  return (
    <div className="trace-viewer">
      <header className="trace-header">
        <Link to="/" className="back-link">← Back to Dashboard</Link>
        <h1>Trace Timeline</h1>
        <div className="trace-meta">
          <span>Service: api-gateway</span>
          <span>PID: 12345</span>
          <span>Duration: {totalDuration}ms</span>
        </div>
      </header>

      <div className="timeline-container">
        <h2>Trace Timeline</h2>
        <div className="timeline">
          {spans.map((span, index) => (
            <div 
              key={span.spanId}
              className={`timeline-row ${span.status}`}
              onClick={() => setSelectedSpan(span)}
            >
              <div className="timeline-label">
                <span className="span-name">{span.operationName}</span>
                <span className="span-service">{span.serviceName}</span>
              </div>
              <div className="timeline-bar-container">
                <div 
                  className="timeline-bar"
                  style={{
                    left: `${(span.startTime / totalDuration) * 100}%`,
                    width: `${(span.duration / totalDuration) * 100}%`
                  }}
                >
                  <span className="duration-label">{span.duration}ms</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedSpan && (
        <div className="span-detail-modal">
          <div className="span-detail-content">
            <h3>Span Details</h3>
            <div className="span-detail-grid">
              <div><strong>Operation:</strong> {selectedSpan.operationName}</div>
              <div><strong>Service:</strong> {selectedSpan.serviceName}</div>
              <div><strong>Span ID:</strong> <code>{selectedSpan.spanId}</code></div>
              <div><strong>Start Time:</strong> {selectedSpan.startTime}ms</div>
              <div><strong>Duration:</strong> {selectedSpan.duration}ms</div>
              <div><strong>Status:</strong> <span className={`status-badge ${selectedSpan.status}`}>{selectedSpan.status}</span></div>
            </div>
            <button onClick={() => setSelectedSpan(null)} className="close-btn">Close</button>
          </div>
        </div>
      )}

      <footer className="dashboard-footer">
        <p>Distributed Tracing System &copy; 2026 | Trace Viewer</p>
      </footer>
    </div>
  );
}
