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
