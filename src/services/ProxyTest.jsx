import { useState } from 'react';
import { testProxy } from '../services/api';

export default function ProxyTest() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleTest = async () => {
    if (!url) {
      alert('Please enter a URL');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await testProxy(url);
      setResult({
        success: true,
        message: 'Proxy test completed',
        proxyStatus: response.proxyStatus,
        traceId: response.traceId,
        data: response.data
      });
    } catch (error) {
      setResult({
        success: false,
        message: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="test-component">
      <h3>Proxy Test</h3>
      <p>Test proxy requests with trace context propagation</p>

      <div className="test-input">
        <label>
          URL:
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            disabled={loading}
          />
        </label>
      </div>

      <button 
        onClick={handleTest} 
        disabled={loading}
        className="test-button"
      >
        {loading ? 'Sending...' : 'Send'}
      </button>

      {result && (
        <div className={`test-result ${result.success ? 'success' : 'error'}`}>
          <p>{result.message}</p>
          {result.proxyStatus && (
            <p>Proxy Status: {result.proxyStatus}</p>
          )}
          {result.traceId && (
            <p className="trace-id">
              Trace ID: <code>{result.traceId}</code>
            </p>
          )}
          {result.data && (
            <p className="proxy-data">Data: {result.data}</p>
          )}
        </div>
      )}
    </div>
  );
}
