import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Dashboard/Dashboard.css';

export default function ProxyTest() {
  const navigate = useNavigate();
  const [url, setUrl] = useState('https://jsonplaceholder.typicode.com/posts/1');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  const handleTest = async () => {
    if (!url) {
      setError('Please enter a URL');
      return;
    }

    setLoading(true);
    setError(null);
    const startTime = Date.now();
    
    try {
      const res = await fetch('/api/traces/test/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      const endTime = Date.now();
      
      if (!res.ok) {
        setError(data.error || `Server error: ${res.status}`);
        setResults(prev => [{
          timestamp: new Date().toLocaleTimeString(),
          url: url.length > 30 ? url.substring(0, 30) + '...' : url,
          status: res.status,
          latency: endTime - startTime,
          success: false
        }, ...prev].slice(0, 20));
        setLoading(false);
        return;
      }
      
      setResults(prev => [{
        timestamp: new Date().toLocaleTimeString(),
        url: url.length > 30 ? url.substring(0, 30) + '...' : url,
        status: res.status,
        latency: endTime - startTime,
        success: res.ok
      }, ...prev].slice(0, 20));
    } catch (err) {
      setError(err.message);
    }
    
    setLoading(false);
  };

  const presetUrls = [
    'https://jsonplaceholder.typicode.com/posts/1',
    'https://jsonplaceholder.typicode.com/users/1',
    'https://httpbin.org/get',
    'https://api.github.com/users/octocat'
  ];

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Proxy Test</h1>
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
          <div className="metrics-card-title">Total Requests</div>
          <div className="metrics-card-value">{results.length}</div>
        </div>
        <div className="metrics-card">
          <div className="metrics-card-title">Success Rate</div>
          <div className="metrics-card-value">
            {results.length > 0 
              ? ((results.filter(r => r.success).length / results.length) * 100).toFixed(0) 
              : 0}%
          </div>
        </div>
        <div className="metrics-card">
          <div className="metrics-card-title">Avg Latency</div>
          <div className="metrics-card-value">
            {results.length > 0 
              ? (results.reduce((a, b) => a + b.latency, 0) / results.length).toFixed(0) 
              : 0}ms
          </div>
        </div>
      </div>

      <div className="test-form-card">
        <h3>Configure Proxy Test</h3>
        <div className="test-form">
          <div className="form-group">
            <label>Target URL</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </div>
          <div className="preset-buttons">
            <span>Presets:</span>
            {presetUrls.map((preset, idx) => (
              <button 
                key={idx}
                onClick={() => setUrl(preset)}
                className="preset-btn"
              >
                {idx + 1}
              </button>
            ))}
          </div>
          <button 
            onClick={handleTest} 
            className="refresh-btn"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Request'}
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
                <th>URL</th>
                <th>Status</th>
                <th>Latency</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, idx) => (
                <tr key={idx}>
                  <td>{result.timestamp}</td>
                  <td><code>{result.url}</code></td>
                  <td>
                    <span className={`status-badge ${result.success ? 'success' : 'danger'}`}>
                      {result.status}
                    </span>
                  </td>
                  <td>{result.latency}ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <footer className="dashboard-footer">
        <p>Distributed Tracing System &copy; 2026 | Proxy Test</p>
      </footer>
    </div>
  );
}
