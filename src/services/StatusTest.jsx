import { useState } from 'react';
import { simulateStatus } from '../services/api';

export default function StatusTest() {
  const [statusCode, setStatusCode] = useState('200');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleTest = async () => {
    const code = parseInt(statusCode);
    if (isNaN(code)) {
      alert('Please enter a valid status code');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await simulateStatus(code);
      setResult({
        success: code < 400,
        message: `Status code: ${code}`,
        traceId: response.traceId
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
      <h3>Force Status Code</h3>
      <p>Test error handling with different status codes</p>

      <div className="test-input">
        <label>
          Status Code:
          <input
            type="number"
            value={statusCode}
            onChange={(e) => setStatusCode(e.target.value)}
            min="100"
            max="600"
            disabled={loading}
          />
        </label>
      </div>

      <button 
        onClick={handleTest} 
        disabled={loading}
        className="test-button"
      >
        {loading ? 'Testing...' : 'Test'}
      </button>

      {result && (
        <div className={`test-result ${result.success ? 'success' : 'error'}`}>
          <p>{result.message}</p>
          {result.traceId && (
            <p className="trace-id">
              Trace ID: <code>{result.traceId}</code>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
