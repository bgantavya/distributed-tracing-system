import './TraceViewer.css';

export default function TraceList({ spans }) {
  return (
    <div className="trace-list">
      {spans.map((span) => (
        <div key={span.spanId} className="trace-list-item">
          <span className="span-operation">{span.operationName}</span>
          <span className="span-duration">{span.duration}ms</span>
        </div>
      ))}
    </div>
  );
}
