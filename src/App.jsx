import { useEffect, useMemo, useState } from 'react';
import { BRANCHES, ENDPOINTS } from './data';

const cloneEndpoint = (endpoint) => ({
  ...endpoint,
  pathParams: endpoint.pathParams.map((item) => ({ ...item })),
  queryParams: endpoint.queryParams.map((item) => ({ ...item })),
});

const pretty = (value) => JSON.stringify(value, null, 4);

const resolveTraces = (payload) => {
  if (Array.isArray(payload?.traces)) return payload.traces;
  if (Array.isArray(payload?.body?.traces)) return payload.body.traces;
  return [];
};

const buildPath = (draft) => {
  if (!draft) return '/';

  let path = draft.pathTemplate;
  draft.pathParams.forEach((param) => {
    path = path.replace(`:${param.key}`, encodeURIComponent(param.value || ''));
  });

  const query = draft.queryParams
    .filter((param) => param.value)
    .map((param) => `${encodeURIComponent(param.key)}=${encodeURIComponent(param.value)}`)
    .join('&');

  return query ? `${path}?${query}` : path;
};

const stateClassForStatus = (status) => {
  if (status >= 500) return 'state-error';
  if (status >= 400) return 'state-warn';
  return 'state-good';
};

const isNetworkError = (error) => {
  const message = String(error?.message || error || '').toLowerCase();
  return message.includes('failed to fetch') || message.includes('networkerror') || message.includes('network error');
};

const toUserError = (error, baseUrl) => {
  if (isNetworkError(error)) {
    return `Unable to reach ${baseUrl}. If this works locally but fails on GitHub Pages, enable CORS on the backend for origin https://bgantavya.github.io (or specific repo pages URL).`;
  }
  return String(error?.message || error);
};

const proxyRequest = async ({ baseUrl, method, path, body }) => {
  const response = await fetch('/api/proxy', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ baseUrl, method, path, body }),
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    throw new Error(payload?.error || payload?.details || 'Proxy request failed');
  }

  return payload;
};

const directRequest = async ({ baseUrl, method, path, body }) => {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const contentType = response.headers.get('content-type') || '';
  const responseBody = contentType.includes('application/json') ? await response.json() : await response.text();

  return {
    status: response.status,
    statusText: response.statusText,
    traceId: response.headers.get('x-trace-id'),
    body: responseBody,
  };
};

const requestBackend = async (request) => {
  if (import.meta.env.PROD) {
    return directRequest(request);
  }

  try {
    return await proxyRequest(request);
  } catch {
    return directRequest(request);
  }
};

function Metric({ label, value }) {
  return (
    <div className="metric-card">
      <span className="metric-label">{label}</span>
      <span className="metric-value">{value}</span>
    </div>
  );
}

function Breakdown({ title, entries }) {
  const max = Math.max(...entries.map((entry) => entry.count), 1);

  return (
    <section className="breakdown-card">
      <h4>{title}</h4>
      {entries.length ? entries.map((entry) => (
        <div className="breakdown-row" key={entry.label}>
          <span>{entry.label}</span>
          <div className="bar">
            <span className="bar-fill" style={{ width: `${Math.max(6, Math.round((entry.count / max) * 100))}%` }} />
          </div>
          <strong>{entry.count}</strong>
        </div>
      )) : <p className="muted">No data</p>}
    </section>
  );
}

function Meta({ label, value }) {
  return (
    <div className="meta-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function App() {
  const [branchKey, setBranchKey] = useState(null);
  const [activeView, setActiveView] = useState('endpoint');
  const [baseUrl, setBaseUrl] = useState('');
  const [selectedEndpointId, setSelectedEndpointId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [dashboard, setDashboard] = useState({ loading: false, error: '', traces: [] });
  const [responseState, setResponseState] = useState({
    status: '-',
    traceId: '-',
    layer: '-',
    body: 'No response yet.',
  });
  const [requestState, setRequestState] = useState('idle');

  const activeBranch = branchKey ? BRANCHES[branchKey] : null;

  const validEndpoints = useMemo(() => {
    if (!branchKey) return [];
    return ENDPOINTS.filter((endpoint) => endpoint.validBranches.includes(branchKey)).map(cloneEndpoint);
  }, [branchKey]);

  const stats = useMemo(() => {
    const traces = dashboard.traces;
    const total = traces.length;
    const errors = traces.filter((trace) => Number(trace.statusCode) >= 400).length;
    const slow = traces.filter((trace) => Number(trace.durationMs || 0) >= 1000).length;
    const avg = total ? Math.round(traces.reduce((sum, trace) => sum + Number(trace.durationMs || 0), 0) / total) : 0;
    return { total, errors, slow, avg };
  }, [dashboard.traces]);

  const statusEntries = useMemo(
    () => Object.entries(dashboard.traces.reduce((acc, trace) => {
      const key = String(trace.statusCode ?? 'unknown');
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})).map(([label, count]) => ({ label, count })),
    [dashboard.traces],
  );

  const methodEntries = useMemo(
    () => Object.entries(dashboard.traces.reduce((acc, trace) => {
      const key = String(trace.method ?? 'UNKNOWN');
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})).map(([label, count]) => ({ label, count })),
    [dashboard.traces],
  );

  useEffect(() => {
    if (!branchKey) {
      setBaseUrl('');
      setSelectedEndpointId(null);
      setDraft(null);
      setDashboard({ loading: false, error: '', traces: [] });
      return;
    }

    setBaseUrl(BRANCHES[branchKey].baseUrl);
    setSelectedEndpointId(null);
    setDraft(null);
  }, [branchKey]);

  const loadDashboard = async (url = baseUrl) => {
    if (!url) return;

    setDashboard((current) => ({ ...current, loading: true, error: '' }));
    try {
      const payload = await requestBackend({ baseUrl: url, method: 'GET', path: '/logs' });
      setDashboard({ loading: false, error: '', traces: resolveTraces(payload?.body ?? payload) });
    } catch (error) {
      setDashboard({ loading: false, error: toUserError(error, url), traces: [] });
    }
  };

  useEffect(() => {
    if (!baseUrl) return;
    loadDashboard(baseUrl);
  }, [baseUrl]);

  const openEndpoint = (endpoint) => {
    setSelectedEndpointId(endpoint.id);
    setDraft(cloneEndpoint(endpoint));
    setRequestState('idle');
    setResponseState({ status: '-', traceId: '-', layer: '-', body: 'No response yet.' });
  };

  const updateDraftParam = (collection, key, value) => {
    setDraft((current) => ({
      ...current,
      [collection]: current[collection].map((param) => (param.key === key ? { ...param, value } : param)),
    }));
  };

  const sendRequest = async () => {
    if (!draft || !baseUrl) return;

    setRequestState('pending');
    try {
      const method = draft.method;
      const path = buildPath(draft);
      let requestBody;

      if (['POST', 'PUT', 'PATCH'].includes(method) && draft.body.trim()) {
        requestBody = JSON.parse(draft.body);
      }

      const payload = await requestBackend({
        baseUrl,
        method,
        path,
        body: requestBody,
      });

      const status = Number(payload?.status || 500);
      const statusText = payload?.statusText || '';
      const traceId = payload?.traceId || 'Not available';
      const responseBody = payload?.body ?? payload;

      setResponseState({
        status: `${status} ${statusText}`,
        traceId,
        layer: status < 400 ? 'Execution Layer: Successful Request' : stateClassForStatus(status),
        body: pretty(responseBody),
      });
      setRequestState(status < 400 ? 'success' : 'error');
      await loadDashboard(baseUrl);
    } catch (error) {
      setResponseState({
        status: 'Network Error',
        traceId: '-',
        layer: 'Transport Layer Failure',
        body: toUserError(error, baseUrl),
      });
      setRequestState('error');
    }
  };

  const resetRequest = () => {
    if (!selectedEndpointId) return;
    const original = ENDPOINTS.find((endpoint) => endpoint.id === selectedEndpointId);
    if (!original) return;
    setDraft(cloneEndpoint(original));
    setResponseState({ status: '-', traceId: '-', layer: '-', body: 'No response yet.' });
    setRequestState('idle');
  };

  const requestBodyVisible = draft && !['GET', 'DELETE'].includes(draft.method);

  return (
    <main className="app-shell">
      {!branchKey ? (
        <section className="hero panel">
          <p className="eyebrow">Distributed Tracing Studio</p>
          <h1>DTS Request Studio</h1>
          <p className="sub">React frontend for branch-aware requests and dashboard analytics.</p>
          <div className="branch-actions">
            <button type="button" className="primary" onClick={() => setBranchKey('master')}>Master</button>
            <button type="button" className="primary" onClick={() => setBranchKey('development')}>Development</button>
          </div>
        </section>
      ) : (
        <>
          <header className="topbar panel">
            <div>
              <p className="eyebrow">Active branch</p>
              <h2>{activeBranch.label}</h2>
              <p className="sub">Backend: {baseUrl}</p>
            </div>
            <div className="topbar-actions">
              <label>
                Base URL
                <input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value.trim())} />
              </label>
              <button type="button" className="ghost" onClick={() => setBranchKey(null)}>Switch branch</button>
            </div>
          </header>

          <section className="panel view-switch">
            <button
              type="button"
              className={`switch-btn ${activeView === 'endpoint' ? 'active' : ''}`}
              onClick={() => setActiveView('endpoint')}
            >
              Endpoint Studio
            </button>
            <button
              type="button"
              className={`switch-btn ${activeView === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveView('dashboard')}
            >
              Dashboard
            </button>
          </section>

          {activeView === 'dashboard' ? (
            <section className="panel dashboard-panel">
              <div className="section-head">
                <h3>Dashboard</h3>
                <button type="button" className="ghost" onClick={() => loadDashboard(baseUrl)}>Refresh Logs</button>
              </div>

              <div className="metric-grid">
                <Metric label="Total Traces" value={stats.total} />
                <Metric label="Errors" value={stats.errors} />
                <Metric label="Slow" value={stats.slow} />
                <Metric label="Avg Duration" value={`${stats.avg}ms`} />
              </div>

              <div className="dashboard-grid">
                <Breakdown title="Status Breakdown" entries={statusEntries} />
                <Breakdown title="Method Breakdown" entries={methodEntries} />
              </div>

              <div className="trace-table-card">
                <div className="section-head compact">
                  <h4>Recent Traces</h4>
                  <span className="muted">Latest 12 items</span>
                </div>
                <table className="trace-table">
                  <thead>
                    <tr>
                      <th>Method</th>
                      <th>Path</th>
                      <th>Status</th>
                      <th>Duration</th>
                      <th>IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.loading ? (
                      <tr><td colSpan="5">Loading...</td></tr>
                    ) : dashboard.error ? (
                      <tr><td colSpan="5">{dashboard.error}</td></tr>
                    ) : dashboard.traces.length ? (
                      dashboard.traces.slice(0, 12).map((trace) => (
                        <tr key={trace.id}>
                          <td>{trace.method}</td>
                          <td className="truncate">{trace.path}</td>
                          <td><span className={`status-pill ${stateClassForStatus(Number(trace.statusCode))}`}>{trace.statusCode}</span></td>
                          <td>{Number(trace.durationMs || 0)}ms</td>
                          <td>{trace.ip || '-'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="5">No traces found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          ) : (
            <section className="panel content-grid">
              <section className="content-column">
              {draft ? (
                <article className={`request-card ${requestState}`}>
                  <div className="request-head">
                    <div>
                      <p className="eyebrow">Request Studio</p>
                      <h4>{draft.name}</h4>
                      <p className="sub">{draft.description}</p>
                    </div>
                    <span className="method-badge">{draft.method}</span>
                  </div>

                  <label>
                    Request path
                    <input value={buildPath(draft)} readOnly />
                  </label>

                  <label>
                    Request type
                    <select
                      value={draft.method}
                      onChange={(e) => setDraft((current) => ({ ...current, method: e.target.value }))}
                    >
                      <option>GET</option>
                      <option>POST</option>
                      <option>PUT</option>
                      <option>PATCH</option>
                      <option>DELETE</option>
                    </select>
                  </label>

                  <div className="params-grid">
                    {draft.pathParams.map((param) => (
                      <label key={param.key}>
                        {param.label}
                        <input
                          value={param.value}
                          onChange={(e) => updateDraftParam('pathParams', param.key, e.target.value)}
                        />
                      </label>
                    ))}
                    {draft.queryParams.map((param) => (
                      <label key={param.key}>
                        {param.label}
                        <input
                          value={param.value}
                          onChange={(e) => updateDraftParam('queryParams', param.key, e.target.value)}
                        />
                      </label>
                    ))}
                  </div>

                  {requestBodyVisible && (
                    <label>
                      Body (JSON)
                      <textarea
                        rows="4"
                        value={draft.body}
                        onChange={(e) => setDraft((current) => ({ ...current, body: e.target.value }))}
                        placeholder="{}"
                      />
                    </label>
                  )}

                  <div className="request-actions">
                    <button type="button" className="primary" onClick={sendRequest}>Send Request</button>
                    <button type="button" className="ghost" onClick={resetRequest}>Reset</button>
                  </div>

                  <div className="response-box">
                    <div className="section-head compact">
                      <h4>Response Snapshot</h4>
                      <span className="muted">Organized view</span>
                    </div>
                    <div className="response-meta">
                      <Meta label="Status" value={responseState.status} />
                      <Meta label="Trace Id" value={responseState.traceId} />
                      <Meta label="Layer" value={responseState.layer} />
                    </div>
                    <pre className="response-body">{responseState.body}</pre>
                  </div>
                </article>
              ) : (
                <div className="empty-state panel-inner">Select an endpoint from the right panel.</div>
              )}
              </section>

              <aside className="info-column">
                <section className="panel-inner">
                  <div className="info-card">
                    <h4>Tracing Policy</h4>
                    <pre>{pretty(activeBranch.policy)}</pre>
                  </div>
                  <h3>Endpoints</h3>
                  <div className="catalog-list">
                    {validEndpoints.map((endpoint) => (
                      <button
                        key={endpoint.id}
                        type="button"
                        className={`catalog-item ${selectedEndpointId === endpoint.id ? 'selected' : ''}`}
                        onClick={() => openEndpoint(endpoint)}
                      >
                        <span className="catalog-title">{endpoint.name}</span>
                        <span className="catalog-meta">{endpoint.method} {endpoint.pathTemplate}</span>
                        <span className="catalog-desc">{endpoint.description}</span>
                      </button>
                    ))}
                  </div>

                </section>
              </aside>
            </section>
          )}
        </>
      )}
    </main>
  );
}
