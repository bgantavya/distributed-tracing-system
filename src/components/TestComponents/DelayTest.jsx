import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Dashboard/Dashboard.css';

export default function DelayTest() {
  const navigate = useNavigate();
  const [delay, setDelay] = useState(1000);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  const handleTest = async () => {
    setLoading(true);
    setError(null);
    const startTime = Date.now();
    
    try {
      const res = await fetch('/api/traces/test/delay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seconds: delay / 1000 })
      });
      const data = await res.json();
      const endTime = Date.now();
      const actualDelay = endTime - startTime;
      
      setResults(prev => [{
        timestamp: new Date().toLocaleTimeString(),
        requested: delay,
        actual: actualDelay,
        status: res.ok ? 'Success' : 'Error'
      }, ...prev].slice(0, 20));
    } catch (err) {
      setError(err.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Delay Test</h1>
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
          <div className="metrics-card-title">Avg Delay</div>
          <div className="metrics-card-value">
            {results.length > 0 
              ? (results.reduce((a, b) => a + b.actual, 0) / results.length).toFixed(0) 
              : 0}ms
          </div>
        </div>
        <div className="metrics-card">
          <div className="metrics-card-title">Success Rate</div>
          <div className="metrics-card-value">
            {results.length > 0 
              ? ((results.filter(r => r.status === 'Success').length / results.length) * 100).toFixed(0) 
              : 0}%
          </div>
        </div>
      </div>

      <div className="test-form-card">
        <h3>Configure Delay Test</h3>
        <div className="test-form">
          <div className="form-group">
            <label>Delay (ms)</label>
            <input
              type="range"
              min="100"
              max="5000"
              step="100"
              value={delay}
              onChange={(e) => setDelay(Number(e.target.value))}
            />
            <span className="delay-value">{delay}ms</span>
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
                <th>Requested</th>
                <th>Actual</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, idx) => (
                <tr key={idx}>
                  <td>{result.timestamp}</td>
                  <td>{result.requested}ms</td>
                  <td>{result.actual}ms</td>
                  <td>
                    <span className={`status-badge ${result.status === 'Success' ? 'success' : 'danger'}`}>
                      {result.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <footer className="dashboard-footer">
        <p>Distributed Tracing System &copy; 2026 | Delay Test</p>
      </footer>
    </div>
  );
}
