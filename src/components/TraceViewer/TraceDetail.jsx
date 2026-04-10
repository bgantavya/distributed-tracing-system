import './TraceViewer.css';

export default function TraceDetail({ trace }) {
  return (
    <div className="trace-detail">
      <div className="detail-row">
        <span className="detail-label">Trace ID:</span>
        <span className="detail-value"><code>{trace.traceId}</code></span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Service:</span>
        <span className="detail-value">{trace.serviceName}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Process ID:</span>
        <span className="detail-value">{trace.processId}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Duration:</span>
        <span className="detail-value">{trace.duration}ms</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Status:</span>
        <span className={`detail-value status-badge ${trace.status}`}>{trace.status}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Start Time:</span>
        <span className="detail-value">{new Date(trace.startTime).toLocaleString()}</span>
      </div>
      {trace.errorMessage && (
        <div className="detail-row error">
          <span className="detail-label">Error:</span>
          <span className="detail-value">{trace.errorMessage}</span>
        </div>
      )}
    </div>
  );
}
