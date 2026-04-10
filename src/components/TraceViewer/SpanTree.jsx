import { useState } from 'react';
import './TraceViewer.css';

function buildSpanTree(spans) {
  const spanMap = new Map();
  const rootSpans = [];

  spans.forEach(span => {
    spanMap.set(span.spanId, { ...span, children: [] });
  });

  spans.forEach(span => {
    const spanNode = spanMap.get(span.spanId);
    if (span.parentSpanId) {
      const parent = spanMap.get(span.parentSpanId);
      if (parent) {
        parent.children.push(spanNode);
      } else {
        rootSpans.push(spanNode);
      }
    } else {
      rootSpans.push(spanNode);
    }
  });

  return rootSpans;
}

function SpanNode({ span, level = 0 }) {
  const [expanded, setExpanded] = useState(level < 2);
  const hasChildren = span.children && span.children.length > 0;

  const statusColor = {
    ok: 'var(--color-success)',
    error: 'var(--color-danger)',
    client_error: 'var(--color-warning)',
    server_error: 'var(--color-danger)'
  }[span.status] || 'var(--color-success)';

  return (
    <div className="span-node" style={{ marginLeft: level * 20 }}>
      <div 
        className="span-node-header"
        onClick={() => hasChildren && setExpanded(!expanded)}
        style={{ borderLeftColor: statusColor }}
      >
        {hasChildren && (
          <span className="expand-icon">
            {expanded ? '▼' : '▶'}
          </span>
        )}
        <span className="span-name">{span.operationName}</span>
        <span className="span-duration">{span.duration}ms</span>
        <span className="span-service">{span.serviceName}</span>
      </div>

      {expanded && hasChildren && (
        <div className="span-children">
          {span.children.map(child => (
            <SpanNode key={child.spanId} span={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SpanTree({ spans }) {
  const tree = buildSpanTree(spans);

  return (
    <div className="span-tree">
      {tree.map(span => (
        <SpanNode key={span.spanId} span={span} />
      ))}
    </div>
  );
}
