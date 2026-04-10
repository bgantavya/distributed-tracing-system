<<<<<<< HEAD
# Distributed Tracing System - Frontend Documentation

## Overview

This document describes the frontend architecture of the Distributed Tracing System, detailing the React components, state management, API integration, visualization, and user interactions for monitoring distributed traces.

## Architecture Components

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Frontend Architecture                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │                      React Application                                │    │
│  │  ┌────────────────────────────────────────────────────────────────┐  │    │
│  │  │                     App Component                               │  │    │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │  │    │
│  │  │  │  Dashboard  │  │   Trace     │  │   Stats     │            │  │    │
│  │  │  │   View      │  │   Viewer    │  │   View      │            │  │    │
│  │  │  └─────────────┘  └─────────────┘  └─────────────┘            │  │    │
│  │  └────────────────────────────────────────────────────────────────┘  │    │
│  │                              │                                          │    │
│  │  ┌────────────────────────────────────────────────────────────────┐  │    │
│  │  │                   Context Providers                            │  │    │
│  │  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │  │    │
│  │  │  │   Tracing    │  │    Theme     │  │     Auth     │        │  │    │
│  │  │  │   Context    │  │   Context    │  │   Context    │        │  │    │
│  │  │  └──────────────┘  └──────────────┘  └──────────────┘        │  │    │
│  │  └────────────────────────────────────────────────────────────────┘  │    │
│  │                              │                                          │    │
│  │  ┌────────────────────────────────────────────────────────────────┐  │    │
│  │  │                     Service Layer                               │  │    │
│  │  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │  │    │
│  │  │  │    API       │  │   WebSocket  │  │    Cache      │        │  │    │
│  │  │  │   Client     │  │   Service    │  │    Service    │        │  │    │
│  │  │  └──────────────┘  └──────────────┘  └──────────────┘        │  │    │
│  │  └────────────────────────────────────────────────────────────────┘  │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                        │                                      │
│                                        ▼                                      │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │                       Backend API                                     │    │
│  │  GET /api/traces/:traceId  │  GET /api/traces/slow  │  GET /api/stats │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 1. Project Structure

```
tracing-ui/
├── public/
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── Dashboard/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Dashboard.css
│   │   │   ├── MetricsCard.jsx
│   │   │   └── RecentTraces.jsx
│   │   ├── TraceViewer/
│   │   │   ├── TraceViewer.jsx
│   │   │   ├── TraceViewer.css
│   │   │   ├── TraceList.jsx
│   │   │   ├── TraceDetail.jsx
│   │   │   └── SpanTree.jsx
│   │   ├── Charts/
│   │   │   ├── DurationChart.jsx
│   │   │   ├── ErrorRateChart.jsx
│   │   │   └── TraceTimeline.jsx
│   │   ├── TestComponents/
│   │   │   ├── DelayTest.jsx
│   │   │   ├── StatusTest.jsx
│   │   │   ├── ProxyTest.jsx
│   │   │   └── LogsViewer.jsx
│   │   └── common/
│   │       ├── LoadingSpinner.jsx
│   │       ├── ErrorBoundary.jsx
│   │       ├── Button.jsx
│   │       ├── Card.jsx
│   │       └── Modal.jsx
│   ├── context/
│   │   ├── TracingContext.jsx
│   │   ├── ThemeContext.jsx
│   │   └── NotificationContext.jsx
│   ├── hooks/
│   │   ├── useTraces.js
│   │   ├── useTraceById.js
│   │   ├── useStats.js
│   │   ├── useWebSocket.js
│   │   └── useAutoRefresh.js
│   ├── services/
│   │   ├── api.js
│   │   ├── websocket.js
│   │   └── cache.js
│   ├── utils/
│   │   ├── formatters.js
│   │   ├── colors.js
│   │   └── validators.js
│   ├── styles/
│   │   ├── variables.css
│   │   ├── global.css
│   │   └── components.css
│   ├── App.jsx
│   ├── App.css
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## 2. API Service Layer

### 2.1 Main API Client

```javascript
// src/services/api.js

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

apiClient.interceptors.request.use(
  (config) => {
    const traceId = localStorage.getItem('traceId');
    if (traceId) {
      config.headers['X-Trace-ID'] = traceId;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const getTraceById = async (traceId) => {
  const response = await apiClient.get(`/api/traces/trace/${traceId}`);
  return response.data;
};

export const getTracesByService = async (serviceName, startDate, endDate) => {
  const params = new URLSearchParams({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  });
  const response = await apiClient.get(`/api/traces/service/${serviceName}?${params}`);
  return response.data;
};

export const getSlowTraces = async (threshold = 1000) => {
  const response = await apiClient.get(`/api/traces/slow?threshold=${threshold}`);
  return response.data;
};

export const getErrorTraces = async () => {
  const response = await apiClient.get('/api/traces/errors');
  return response.data;
};

export const getTracesByProcess = async (processId) => {
  const response = await apiClient.get(`/api/traces/process/${processId}`);
  return response.data;
};

export const getStats = async (serviceName, startDate, endDate) => {
  const params = new URLSearchParams({
    serviceName,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  });
  const response = await apiClient.get(`/api/traces/stats?${params}`);
  return response.data;
};

export const getHealth = async () => {
  const response = await apiClient.get('/health');
  return response.data;
};

export const simulateDelay = async (seconds) => {
  const response = await apiClient.post('/api/test/delay', { seconds });
  return response.data;
};

export const simulateStatus = async (statusCode) => {
  const response = await apiClient.post('/api/test/status', { statusCode });
  return response.data;
};

export const testProxy = async (url) => {
  const response = await apiClient.post('/api/test/proxy', { url });
  return response.data;
};

export default apiClient;
```

### 2.2 WebSocket Service

```javascript
// src/services/websocket.js

class WebSocketService {
  constructor() {
    this.ws = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  connect(url = 'ws://localhost:3000/ws') {
    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.emit('connected', {});
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit('message', data);
          
          if (data.type) {
            this.emit(data.type, data.payload);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.emit('error', error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.emit('disconnected', {});
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      setTimeout(() => this.connect(), delay);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }
}

export const wsService = new WebSocketService();
```

### 2.3 Cache Service

```javascript
// src/services/cache.js

class CacheService {
  constructor() {
    this.cache = new Map();
    this.maxSize = 100;
    this.ttl = 60000;
  }

  set(key, value, ttl = this.ttl) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl
    });
  }

  get(key) {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

export const cacheService = new CacheService();
setInterval(() => cacheService.cleanup(), 60000);
```

## 3. Context Providers

### 3.1 Tracing Context

```javascript
// src/context/TracingContext.jsx

import { createContext, useContext, useReducer, useCallback } from 'react';

const TracingContext = createContext(null);

const initialState = {
  traces: [],
  selectedTrace: null,
  filters: {
    serviceName: '',
    status: 'all',
    minDuration: 0,
    maxDuration: Infinity,
    startDate: null,
    endDate: null
  },
  stats: null,
  loading: false,
  error: null,
  autoRefresh: false,
  refreshInterval: 5000
};

function tracingReducer(state, action) {
  switch (action.type) {
    case 'SET_TRACES':
      return { ...state, traces: action.payload, loading: false };
    case 'SELECT_TRACE':
      return { ...state, selectedTrace: action.payload };
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case 'SET_STATS':
      return { ...state, stats: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'ADD_TRACE':
      return { ...state, traces: [action.payload, ...state.traces].slice(0, 100) };
    case 'SET_AUTO_REFRESH':
      return { ...state, autoRefresh: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

export function TracingProvider({ children }) {
  const [state, dispatch] = useReducer(tracingReducer, initialState);

  const selectTrace = useCallback((trace) => {
    dispatch({ type: 'SELECT_TRACE', payload: trace });
  }, []);

  const updateFilters = useCallback((filters) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  }, []);

  const addTrace = useCallback((trace) => {
    dispatch({ type: 'ADD_TRACE', payload: trace });
  }, []);

  const setLoading = useCallback((loading) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const setError = useCallback((error) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const toggleAutoRefresh = useCallback(() => {
    dispatch({ type: 'SET_AUTO_REFRESH', payload: !state.autoRefresh });
  }, [state.autoRefresh]);

  const value = {
    ...state,
    selectTrace,
    updateFilters,
    addTrace,
    setLoading,
    setError,
    clearError,
    toggleAutoRefresh
  };

  return (
    <TracingContext.Provider value={value}>
      {children}
    </TracingContext.Provider>
  );
}

export function useTracing() {
  const context = useContext(TracingContext);
  if (!context) {
    throw new Error('useTracing must be used within a TracingProvider');
  }
  return context;
}
```

### 3.2 Theme Context

```javascript
// src/context/ThemeContext.jsx

import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved || 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
```

## 4. Custom Hooks

### 4.1 useTraces Hook

```javascript
// src/hooks/useTraces.js

import { useState, useEffect, useCallback } from 'react';
import { getTracesByService, getSlowTraces, getErrorTraces } from '../services/api';
import { useTracing } from '../context/TracingContext';

export function useTraces(serviceName) {
  const [traces, setTraces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { filters } = useTracing();

  const fetchTraces = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const now = new Date();
      const startDate = filters.startDate || new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const endDate = filters.endDate || now;

      const data = await getTracesByService(serviceName, startDate, endDate);
      setTraces(data.spans || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [serviceName, filters]);

  useEffect(() => {
    fetchTraces();
  }, [fetchTraces]);

  const filteredTraces = traces.filter(trace => {
    if (filters.status !== 'all' && trace.status !== filters.status) {
      return false;
    }
    if (trace.duration < filters.minDuration || trace.duration > filters.maxDuration) {
      return false;
    }
    return true;
  });

  return {
    traces: filteredTraces,
    loading,
    error,
    refresh: fetchTraces
  };
}
```

### 4.2 useTraceById Hook

```javascript
// src/hooks/useTraceById.js

import { useState, useEffect, useCallback } from 'react';
import { getTraceById } from '../services/api';
import { cacheService } from '../services/cache';

export function useTraceById(traceId) {
  const [trace, setTrace] = useState(null);
  const [spans, setSpans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTrace = useCallback(async () => {
    if (!traceId) return;

    const cacheKey = `trace_${traceId}`;
    const cached = cacheService.get(cacheKey);
    
    if (cached) {
      setTrace(cached.trace);
      setSpans(cached.spans);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getTraceById(traceId);
      const traceData = {
        ...data.trace[0],
        spans: data.trace
      };
      
      setTrace(traceData);
      setSpans(data.trace);
      cacheService.set(cacheKey, { trace: traceData, spans: data.trace }, 30000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [traceId]);

  useEffect(() => {
    fetchTrace();
  }, [fetchTrace]);

  return { trace, spans, loading, error, refresh: fetchTrace };
}
```

### 4.3 useStats Hook

```javascript
// src/hooks/useStats.js

import { useState, useEffect, useCallback } from 'react';
import { getStats } from '../services/api';

export function useStats(serviceName) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    if (!serviceName) return;

    setLoading(true);
    setError(null);

    try {
      const now = new Date();
      const startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const endDate = now;

      const data = await getStats(serviceName, startDate, endDate);
      setStats(data.stats);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [serviceName]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refresh: fetchStats };
}
```

### 4.4 useAutoRefresh Hook

```javascript
// src/hooks/useAutoRefresh.js

import { useState, useEffect, useRef } from 'react';

export function useAutoRefresh(callback, interval, enabled = true) {
  const savedCallback = useRef(callback);
  const [isActive, setIsActive] = useState(enabled);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!isActive || !enabled) return;

    const tick = () => {
      savedCallback.current();
    };

    const id = setInterval(tick, interval);
    return () => clearInterval(id);
  }, [interval, isActive, enabled]);

  const start = () => setIsActive(true);
  const stop = () => setIsActive(false);
  const toggle = () => setIsActive(prev => !prev);

  return { isActive, start, stop, toggle };
}
```

## 5. React Components

### 5.1 Dashboard Component

```javascript
// src/components/Dashboard/Dashboard.jsx

import { useState, useEffect } from 'react';
import { useTraces } from '../../hooks/useTraces';
import { useStats } from '../../hooks/useStats';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import MetricsCard from './MetricsCard';
import RecentTraces from './RecentTraces';
import './Dashboard.css';

export default function Dashboard({ serviceName = 'distributed-tracing-service' }) {
  const { traces, loading, error, refresh } = useTraces(serviceName);
  const { stats, loading: statsLoading } = useStats(serviceName);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const handleRefresh = () => {
    refresh();
    setLastUpdated(new Date());
  };

  useAutoRefresh(handleRefresh, 5000, false);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Distributed Tracing Dashboard</h1>
        <div className="dashboard-actions">
          <span className="last-updated">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
          <button onClick={handleRefresh} className="refresh-btn">
            Refresh
          </button>
        </div>
      </header>

      {error && (
        <div className="error-banner">
          Error loading traces: {error}
          <button onClick={handleRefresh}>Retry</button>
        </div>
      )}

      <div className="metrics-grid">
        <MetricsCard
          title="Total Traces"
          value={stats?.totalTraces || 0}
          loading={statsLoading}
          icon="traces"
        />
        <MetricsCard
          title="Avg Duration"
          value={`${(stats?.avgDuration || 0).toFixed(2)}ms`}
          loading={statsLoading}
          icon="duration"
        />
        <MetricsCard
          title="Error Rate"
          value={`${((stats?.errorCount || 0) / (stats?.totalTraces || 1) * 100).toFixed(2)}%`}
          loading={statsLoading}
          icon="errors"
          variant={stats?.errorCount > 0 ? 'danger' : 'success'}
        />
        <MetricsCard
          title="P99 Duration"
          value={`${(stats?.p99Duration || 0).toFixed(2)}ms`}
          loading={statsLoading}
          icon="p99"
        />
      </div>

      <div className="dashboard-content">
        <div className="traces-section">
          <h2>Recent Traces</h2>
          <RecentTraces traces={traces} loading={loading} />
        </div>
      </div>
    </div>
  );
}
```

### 5.2 MetricsCard Component

```javascript
// src/components/Dashboard/MetricsCard.jsx

import './Dashboard.css';

const iconMap = {
  traces: (
    <svg viewBox="0 0 24 24" className="card-icon">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
    </svg>
  ),
  duration: (
    <svg viewBox="0 0 24 24" className="card-icon">
      <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
    </svg>
  ),
  errors: (
    <svg viewBox="0 0 24 24" className="card-icon">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
    </svg>
  ),
  p99: (
    <svg viewBox="0 0 24 24" className="card-icon">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
    </svg>
  )
};

export default function MetricsCard({ title, value, loading, icon, variant = 'default' }) {
  return (
    <div className={`metrics-card ${variant}`}>
      <div className="card-icon-wrapper">
        {iconMap[icon]}
      </div>
      <div className="card-content">
        <h3 className="card-title">{title}</h3>
        {loading ? (
          <div className="card-loading">Loading...</div>
        ) : (
          <div className="card-value">{value}</div>
        )}
      </div>
    </div>
  );
}
```

### 5.3 RecentTraces Component

```javascript
// src/components/Dashboard/RecentTraces.jsx

import { Link } from 'react-router-dom';
import './Dashboard.css';

const statusColors = {
  ok: 'success',
  error: 'danger',
  client_error: 'warning',
  server_error: 'danger'
};

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 60000).toFixed(2)}m`;
}

export default function RecentTraces({ traces, loading }) {
  if (loading) {
    return <div className="loading">Loading traces...</div>;
  }

  if (traces.length === 0) {
    return <div className="empty-state">No traces found</div>;
  }

  return (
    <div className="recent-traces">
      <table className="traces-table">
        <thead>
          <tr>
            <th>Trace ID</th>
            <th>Operation</th>
            <th>Service</th>
            <th>Duration</th>
            <th>Status</th>
            <th>Time</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {traces.slice(0, 20).map((trace) => (
            <tr key={trace.spanId}>
              <td className="trace-id">
                <code>{trace.traceId.substring(0, 8)}...</code>
              </td>
              <td>{trace.operationName}</td>
              <td>{trace.serviceName}</td>
              <td className="duration">
                {formatDuration(trace.duration)}
              </td>
              <td>
                <span className={`status-badge ${statusColors[trace.status]}`}>
                  {trace.status}
                </span>
              </td>
              <td className="timestamp">
                {new Date(trace.startTime).toLocaleString()}
              </td>
              <td>
                <Link to={`/trace/${trace.traceId}`} className="view-link">
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### 5.4 TraceViewer Component

```javascript
// src/components/TraceViewer/TraceViewer.jsx

import { useParams, Link } from 'react-router-dom';
import { useTraceById } from '../../hooks/useTraceById';
import TraceList from './TraceList';
import TraceDetail from './TraceDetail';
import SpanTree from './SpanTree';
import './TraceViewer.css';

export default function TraceViewer() {
  const { traceId } = useParams();
  const { trace, spans, loading, error } = useTraceById(traceId);

  if (loading) {
    return (
      <div className="trace-viewer loading">
        <div className="spinner"></div>
        <p>Loading trace {traceId}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="trace-viewer error">
        <h2>Error Loading Trace</h2>
        <p>{error}</p>
        <Link to="/" className="back-link">Back to Dashboard</Link>
      </div>
    );
  }

  if (!trace || spans.length === 0) {
    return (
      <div className="trace-viewer empty">
        <h2>Trace Not Found</h2>
        <p>No trace found with ID: {traceId}</p>
        <Link to="/" className="back-link">Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="trace-viewer">
      <header className="trace-header">
        <Link to="/" className="back-link">← Back to Dashboard</Link>
        <h1>Trace: {traceId}</h1>
        <div className="trace-meta">
          <span>Service: {trace.serviceName}</span>
          <span>PID: {trace.processId}</span>
          <span>Duration: {trace.duration}ms</span>
        </div>
      </header>

      <div className="trace-content">
        <aside className="trace-sidebar">
          <h2>Spans ({spans.length})</h2>
          <TraceList spans={spans} />
        </aside>

        <main className="trace-main">
          <section className="span-tree-section">
            <h2>Span Tree</h2>
            <SpanTree spans={spans} />
          </section>

          <section className="trace-details-section">
            <h2>Trace Details</h2>
            <TraceDetail trace={trace} />
          </section>
        </main>
      </div>
    </div>
  );
}
```

### 5.5 SpanTree Component

```javascript
// src/components/TraceViewer/SpanTree.jsx

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
```

### 5.6 Charts Components

```javascript
// src/components/Charts/DurationChart.jsx

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function DurationChart({ data = [] }) {
  const chartData = {
    labels: data.map(d => new Date(d.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: 'Average Duration (ms)',
        data: data.map(d => d.avgDuration),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'P95 Duration (ms)',
        data: data.map(d => d.p95Duration),
        borderColor: 'rgb(255, 159, 64)',
        backgroundColor: 'rgba(255, 159, 64, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'P99 Duration (ms)',
        data: data.map(d => d.p99Duration),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top'
      },
      title: {
        display: true,
        text: 'Request Duration Over Time'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Duration (ms)'
        }
      }
    }
  };

  return (
    <div className="duration-chart">
      <Line data={chartData} options={options} />
    </div>
  );
}
```

### 5.7 Test Components

```javascript
// src/components/TestComponents/DelayTest.jsx

import { useState } from 'react';
import { simulateDelay } from '../../services/api';
import './TestComponents.css';

export default function DelayTest() {
  const [seconds, setSeconds] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleTest = async () => {
    if (!seconds || isNaN(seconds)) {
      alert('Please enter a valid number of seconds');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await simulateDelay(parseInt(seconds));
      setResult({
        success: true,
        message: `Delay of ${seconds} seconds completed`,
        traceId: response.traceId
      });
    } catch (error) {
      setResult({
        success: false,
        message: error.message,
        traceId: error.response?.headers?.['x-trace-id']
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="test-component delay-test">
      <h3>Simulate Delay</h3>
      <p>Test how the system handles delayed requests</p>

      <div className="test-input">
        <label>
          Delay (seconds):
          <input
            type="number"
            value={seconds}
            onChange={(e) => setSeconds(e.target.value)}
            min="0"
            max="30"
            disabled={loading}
          />
        </label>
      </div>

      <button 
        onClick={handleTest} 
        disabled={loading}
        className="test-button"
      >
        {loading ? 'Running...' : 'Run Test'}
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
```

### 5.8 ErrorBoundary Component

```javascript
// src/components/common/ErrorBoundary.jsx

import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <details className="error-details">
            <summary>Error Details</summary>
            <pre>{this.state.error?.stack}</pre>
          </details>
          <button onClick={this.handleReload} className="reload-btn">
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## 6. Utility Functions

### 6.1 Formatters

```javascript
// src/utils/formatters.js

export function formatDuration(ms) {
  if (ms < 1) return '<1ms';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(2)}m`;
  return `${(ms / 3600000).toFixed(2)}h`;
}

export function formatTimestamp(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleString();
}

export function formatRelativeTime(date) {
  if (!date) return '';
  const now = new Date();
  const d = new Date(date);
  const diff = now - d;

  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function formatPercentage(value, decimals = 2) {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function truncate(str, length = 50) {
  if (!str) return '';
  if (str.length <= length) return str;
  return `${str.substring(0, length)}...`;
}

export function capitalizeFirst(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
```

### 6.2 Color Utilities

```javascript
// src/utils/colors.js

export const statusColors = {
  ok: {
    bg: 'rgba(40, 167, 69, 0.1)',
    text: '#28a745',
    border: '#28a745'
  },
  error: {
    bg: 'rgba(220, 53, 69, 0.1)',
    text: '#dc3545',
    border: '#dc3545'
  },
  client_error: {
    bg: 'rgba(255, 193, 7, 0.1)',
    text: '#ffc107',
    border: '#ffc107'
  },
  server_error: {
    bg: 'rgba(220, 53, 69, 0.1)',
    text: '#dc3545',
    border: '#dc3545'
  }
};

export function getDurationColor(duration) {
  if (duration < 100) return '#28a745';
  if (duration < 500) return '#ffc107';
  if (duration < 1000) return '#fd7e14';
  return '#dc3545';
}

export function getStatusColor(status) {
  return statusColors[status] || statusColors.ok;
}

export const samplingColors = {
  always: '#28a745',
  error: '#dc3545',
  slow: '#fd7e14',
  very_slow: '#dc3545',
  fast: '#6c757d',
  sampled: '#17a2b8',
  dropped: '#6c757d'
};
```

## 7. Routing Configuration

### 7.1 App Router

```javascript
// src/App.jsx

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TracingProvider } from './context/TracingContext';
import { ThemeProvider } from './context/ThemeContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import Dashboard from './components/Dashboard/Dashboard';
import TraceViewer from './components/TraceViewer/TraceViewer';
import DelayTest from './components/TestComponents/DelayTest';
import StatusTest from './components/TestComponents/StatusTest';
import ProxyTest from './components/TestComponents/ProxyTest';
import LogsViewer from './components/TestComponents/LogsViewer';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <TracingProvider>
          <Router>
            <div className="app">
              <nav className="app-nav">
                <Link to="/">Dashboard</Link>
                <Link to="/test/delay">Delay Test</Link>
                <Link to="/test/status">Status Test</Link>
                <Link to="/test/proxy">Proxy Test</Link>
                <Link to="/logs">Logs</Link>
              </nav>

              <main className="app-main">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/trace/:traceId" element={<TraceViewer />} />
                  <Route path="/test/delay" element={<DelayTest />} />
                  <Route path="/test/status" element={<StatusTest />} />
                  <Route path="/test/proxy" element={<ProxyTest />} />
                  <Route path="/logs" element={<LogsViewer />} />
                </Routes>
              </main>
            </div>
          </Router>
        </TracingProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
```

## 8. State Management Patterns

### 8.1 Global State vs Local State

```javascript
// When to use what:

// Use Context for:
// - Current user authentication
// - Theme settings
// - Global tracing filters
// - Notification system

// Use useState for:
// - Component-specific UI state
// - Form inputs
// - Toggle states

// Use useRef for:
// - DOM element references
// - Mutable values that don't trigger re-renders
// - Timer IDs

// Use useMemo for:
// - Expensive calculations
// - Derived data from large datasets
// - Stable references for callbacks
```

### 8.2 Performance Optimizations

```javascript
// Memoization
const memoizedValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// Callback memoization
const handleClick = useCallback(() => {
  doSomething(a, b);
}, [a, b]);

// Lazy loading
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));

// Virtual scrolling for large lists
import { FixedSizeList } from 'react-window';
```

## 9. Environment Variables

```bash
# .env.example

VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
VITE_APP_NAME=Distributed Tracing UI
VITE_DEFAULT_SERVICE=distributed-tracing-service
VITE_REFRESH_INTERVAL=5000
VITE_ENABLE_DEBUG_MODE=false
```

## 10. Future Enhancements

1. **Real-time Updates**: Implement WebSocket for live trace streaming
2. **Advanced Filtering**: Add more sophisticated filter options
3. **Export Functionality**: Export traces in various formats (JSON, CSV, PDF)
4. **Collaboration**: Share traces and annotations with team members
5. **Alerting**: Set up alerts for error thresholds and slow requests
6. **Dark Mode**: Enhance dark mode with more theming options
7. **Mobile Responsive**: Improve mobile experience
8. **Keyboard Shortcuts**: Add keyboard navigation and shortcuts
9. **Bookmarks**: Save favorite traces and filters
10. **Search**: Full-text search across trace data
=======
# Distributed Tracing System - Frontend Flow

## Overview
Frontend is a React application that displays trace data, charts, and allows user authentication.

## Architecture

```
React App (Browser)
      ↓
React Router
      ↓
Components (Pages)
      ↓
Context Providers (Auth, Theme, Tracing)
      ↓
API Client
      ↓
Backend API (Express)
      ↓
MongoDB Atlas
```

## Page Routes

| Path | Page | Auth Required |
|------|------|---------------|
| / | Landing Page | No |
| /login | Login Page | No |
| /signup | Signup Page | No |
| /dashboard | Dashboard | Yes |
| /traces | Traces List | Yes |
| /trace/:id | Trace Detail | Yes |
| /test/delay | Delay Test | Yes |
| /test/status | Status Test | Yes |
| /test/proxy | Proxy Test | Yes |
| /logs | Logs Viewer | Yes |

## Authentication Flow

### User Registration
```
1. Landing Page → Click "Get Started"
2. Login Page → Click "Sign Up"
3. Signup Page → Fill form {name, email, password}
4. Click "Sign Up" button
5. POST to /api/auth/register
6. Server returns {token, user}
7. Save to localStorage:
   - token: JWT string
   - user: user object
   - isAuthenticated: "true"
8. Redirect to /dashboard
```

### User Login (Email/Password)
```
1. Login Page → Fill form {email, password}
2. Click "Sign In" button
3. POST to /api/auth/login
4. Server returns {token, user}
5. Save to localStorage
6. Redirect to /dashboard
```

### User Login (Google OAuth)
```
1. Login Page → Click "Continue with Google"
2. Redirect to /api/auth/google
3. Google OAuth page opens
4. User logs in with Google
5. Google redirects to callback
6. Server creates/finds user → returns JWT
7. Redirect to /login?token=xxx&user=xxx
8. Login component extracts token/user
9. Save to localStorage
10. Redirect to /dashboard
```

### Logout
```
1. Click "Logout" in sidebar
2. Clear localStorage:
   - Remove token
   - Remove user
   - Remove isAuthenticated
3. Redirect to Landing Page (/)
```

## Protected Routes Flow
```
1. User navigates to /dashboard
2. ProtectedRoute component checks:
   - localStorage.getItem('isAuthenticated')
   - localStorage.getItem('token')
3. If both exist → Show dashboard
4. If either missing → Redirect to /login
```

## Dashboard Features

### Metrics Cards (4 cards with click actions)
1. **Total Traces** - Click → Shows all traces popup
2. **Avg Duration** - Click → Shows request durations popup
3. **Error Rate** - Click → Shows error traces popup
4. **P99 Duration** - Click → Shows slowest 1% requests popup

### Charts
- **Area Chart** - Avg Duration over time
- **Pie Chart** - Error vs Success rate
- **Bar Chart** - API Performance comparison
- **Heatmap** - Request activity by hour & status

### Real-time Updates
- Auto-refresh every 5 seconds
- Shows last updated time
- Change indicators on metrics when values change

## API Client Flow

### All API calls include JWT token:
```
Headers:
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <token>"
}
```

### Trace Data Flow
```
1. Dashboard loads
2. useTraces hook fetches /api/traces/service/:name
3. useStats hook fetches /api/traces/stats
4. Data stored in React state
5. Charts and metrics render from data
```

## User Interactions

### Click on Metrics Card → Opens Modal Popup
- Shows relevant data in table
- Summary cards at top
- Close button or click outside to close

### Click on Chart → Opens Detail Modal
- Shows detailed data table
- Same modal style as metrics

### Heatmap
- X-axis: Hours (0-23)
- Y-axis: Status (Success, Error, Client Error)
- Colors: Gray → Blue → Green → Yellow → Orange → Red

## Summary

1. **User** → Lands on Landing Page
2. **Navigate** → Login or Signup
3. **Authenticate** → Email/Password or Google
4. **Store Token** → Save in localStorage
5. **Access Dashboard** → Protected routes allow access
6. **View Data** → Metrics, charts, heatmaps
7. **Interact** → Click cards/charts for details
8. **Logout** → Clear storage, return to landing
>>>>>>> fa9b19fe (Added my project code)
