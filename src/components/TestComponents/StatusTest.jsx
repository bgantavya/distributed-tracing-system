import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Dashboard/Dashboard.css';

export default function StatusTest() {
  const navigate = useNavigate();
  const [statusCode, setStatusCode] = useState(200);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  const handleTest = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/traces/test/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusCode })
      });
      const data = await res.json();
      
      setResults(prev => [{
        timestamp: new Date().toLocaleTimeString(),
        code: statusCode,
        status: res.ok ? 'Success' : 'Error',
        message: typeof data === 'object' && data.message ? String(data.message) : (res.ok ? 'OK' : 'Failed')
      }, ...prev].slice(0, 20));
    } catch (err) {
      setError(err.message);
    }
    
    setLoading(false);
  };

  const statusOptions = [200, 201, 204, 400, 401, 403, 404, 500, 502, 503];

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Status Test</h1>
        <div className="dashboard-actions">
          <button onClick={() => navigate('/dashboard')} className="refresh-btn">
            Back to Dashboard
          </button>
        </div>
      </header>

      <div className="metrics-grid">
        <div className="metrics-card">
          <div className="metrics-card-title">Test Status</div>
          <div className="metrics-card-value">{loading ? 'Testing...' : 'Ready'}</div>
        </div>
        <div className="metrics-card">
          <div className="metrics-card-title">Total Tests</div>
          <div className="metrics-card-value">{results.length}</div>
        </div>
        <div className="metrics-card">
          <div className="metrics-card-title">Success (2xx)</div>
          <div className="metrics-card-value">
            {results.filter(r => r.code >= 200 && r.code < 300).length}
          </div>
        </div>
        <div className="metrics-card">
          <div className="metrics-card-title">Errors (4xx/5xx)</div>
          <div className="metrics-card-value">
            {results.filter(r => r.code >= 400).length}
          </div>
        </div>
      </div>

      <div className="test-form-card">
        <h3>Configure Status Test</h3>
        <div className="test-form">
          <div className="form-group">
            <label>Status Code</label>
            <select
              value={statusCode}
              onChange={(e) => setStatusCode(Number(e.target.value))}
            >
              {statusOptions.map(code => (
                <option key={code} value={code}>{code} - {
                  code === 200 ? 'OK' :
                  code === 201 ? 'Created' :
                  code === 204 ? 'No Content' :
                  code === 400 ? 'Bad Request' :
                  code === 401 ? 'Unauthorized' :
                  code === 403 ? 'Forbidden' :
                  code === 404 ? 'Not Found' :
                  code === 500 ? 'Internal Error' :
                  code === 502 ? 'Bad Gateway' :
                  code === 503 ? 'Service Unavailable' :
                  'Unknown'
                }</option>
              ))}
            </select>
          </div>
          <button 
            onClick={handleTest} 
            className="refresh-btn"
            disabled={loading}
          >
            {loading ? 'Testing...' : 'Run Test'}
          </button>
        </div>
      </div>

      {error && <div className="error-banner">Error: {error}</div>}

      <div className="results-section">
        <h3>Test Results</h3>
        {results.length === 0 ? (
          <div className="empty-state">Run a test to see results</div>
        ) : (
          <table className="modal-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Code</th>
                <th>Status</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, idx) => (
                <tr key={idx}>
                  <td>{result.timestamp}</td>
                  <td><span className={`status-badge ${result.code < 400 ? 'success' : 'danger'}`}>{result.code}</span></td>
                  <td>{result.status}</td>
                  <td>{result.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <footer className="dashboard-footer">
        <p>Distributed Tracing System &copy; 2026 | Status Test</p>
      </footer>
    </div>
  );
}
