import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend, AreaChart, Area } from 'recharts';
import { useTraces } from '../../hooks/useTraces';
import { useStats } from '../../hooks/useStats';
import './Dashboard.css';

const COLORS = ['#22c55e', '#ef4444', '#eab308'];

function MetricsCard({ title, value, loading, icon, variant, previousValue, onValueChange, onClick }) {
  const [animate, setAnimate] = useState(false);
  const [direction, setDirection] = useState(null);

  useEffect(() => {
    if (previousValue !== undefined && value !== previousValue && !loading) {
      setDirection(value > previousValue ? 'up' : 'down');
      setAnimate(true);
      const timer = setTimeout(() => setAnimate(false), 600);
      return () => clearTimeout(timer);
    }
  }, [value, previousValue, loading]);

  return (
    <div 
      className={`metrics-card ${variant || ''} ${animate ? 'animate' : ''} ${direction || ''} ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
    >
      <div className="metrics-card-icon">
        {icon === 'traces' && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        )}
        {icon === 'duration' && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
          </svg>
        )}
        {icon === 'errors' && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
          </svg>
        )}
        {icon === 'p99' && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 17l5-5-5-5M6 17l5-5-5-5"/>
          </svg>
        )}
      </div>
      <div className="metrics-card-content">
        <div className="metrics-card-title">{title}</div>
        <div className="metrics-card-value">
          {loading ? '...' : value}
        </div>
        {animate && (
          <div className={`change-indicator ${direction}`}>
            {direction === 'up' ? '↑' : '↓'} {Math.abs(Number(value) - Number(previousValue)).toFixed(2)}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard({ serviceName = 'distributed-tracing-service' }) {
  const navigate = useNavigate();
  const { traces, loading: tracesLoading } = useTraces(serviceName);
  const { stats, loading: statsLoading } = useStats(serviceName);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [modalData, setModalData] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [prevStats, setPrevStats] = useState({});
  const [showTracesModal, setShowTracesModal] = useState(false);
  const [showDurationModal, setShowDurationModal] = useState(false);
  const [showErrorRateModal, setShowErrorRateModal] = useState(false);
  const [showP99Modal, setShowP99Modal] = useState(false);

  useEffect(() => {
    if (stats && Object.keys(prevStats).length === 0) {
      setPrevStats({
        totalTraces: stats.totalTraces || 0,
        avgDuration: stats.avgDuration || 0,
        errorRate: (stats.errorCount || 0) / (stats.totalTraces || 1) * 100,
        p99Duration: stats.p99Duration || 0
      });
    }
  }, [stats, prevStats]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPrevStats({
        totalTraces: stats?.totalTraces || traces.length,
        avgDuration: stats?.avgDuration || 0,
        errorRate: ((stats?.errorCount || 0) / (stats?.totalTraces || 1) * 100),
        p99Duration: stats?.p99Duration || 0
      });
      setLastUpdated(new Date());
    }, 5000);
    return () => clearInterval(interval);
  }, [stats, traces]);

  const timeSeriesData = useMemo(() => {
    if (!traces.length) return [];
    const grouped = {};
    traces.forEach(trace => {
      const time = new Date(trace.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      if (!grouped[time]) grouped[time] = { count: 0, totalDuration: 0 };
      grouped[time].count++;
      grouped[time].totalDuration += trace.duration || 0;
    });
    return Object.entries(grouped).map(([time, data]) => ({
      time,
      duration: data.count > 0 ? (data.totalDuration / data.count).toFixed(2) : 0
    }));
  }, [traces]);

  const pieData = useMemo(() => {
    if (!traces.length) return [
      { name: 'Success', value: 0 },
      { name: 'Error', value: 0 },
      { name: 'Client Error', value: 0 }
    ];
    const success = traces.filter(t => t.status === 'ok').length;
    const error = traces.filter(t => t.status === 'error' || t.status === 'server_error').length;
    const clientError = traces.filter(t => t.status === 'client_error').length;
    return [
      { name: 'Success', value: success },
      { name: 'Error', value: error },
      { name: 'Client Error', value: clientError }
    ];
  }, [traces]);

  const barData = useMemo(() => {
    if (!traces.length) return [];
    const grouped = {};
    traces.forEach(trace => {
      const op = trace.operationName || 'Unknown';
      if (!grouped[op]) grouped[op] = { count: 0, totalDuration: 0, durations: [] };
      grouped[op].count++;
      grouped[op].totalDuration += trace.duration || 0;
      grouped[op].durations.push(trace.duration || 0);
    });
    return Object.entries(grouped).map(([api, data]) => {
      const sorted = [...data.durations].sort((a, b) => a - b);
      const p99Index = Math.floor(sorted.length * 0.99);
      return {
        api: api.length > 15 ? api.substring(0, 15) + '...' : api,
        apiFull: api,
        avg: (data.totalDuration / data.count).toFixed(2),
        p99: sorted[p99Index] || 0,
        count: data.count
      };
    }).slice(0, 5);
  }, [traces]);

  const openModal = (type, data) => {
    setModalType(type);
    setModalData(data);
  };

  const closeModal = () => {
    setModalType(null);
    setModalData(null);
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Distributed Tracing Dashboard</h1>
        <div className="dashboard-actions">
          <span className="last-updated">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
          <button onClick={() => setLastUpdated(new Date())} className="refresh-btn">
            Refresh
          </button>
        </div>
      </header>

      <div className="metrics-grid">
        <MetricsCard
          title="Total Traces"
          value={stats?.totalTraces || traces.length}
          previousValue={prevStats.totalTraces}
          loading={tracesLoading || statsLoading}
          icon="traces"
          onClick={() => setShowTracesModal(true)}
        />
        <MetricsCard
          title="Avg Duration"
          value={`${(stats?.avgDuration || 0).toFixed(2)}ms`}
          previousValue={prevStats.avgDuration}
          loading={statsLoading}
          icon="duration"
          onClick={() => setShowDurationModal(true)}
        />
        <MetricsCard
          title="Error Rate"
          value={`${((stats?.errorCount || 0) / (stats?.totalTraces || 1) * 100).toFixed(2)}%`}
          previousValue={prevStats.errorRate}
          loading={statsLoading}
          icon="errors"
          variant={stats?.errorCount > 0 ? 'danger' : 'success'}
          onClick={() => setShowErrorRateModal(true)}
        />
        <MetricsCard
          title="P99 Duration"
          value={`${(stats?.p99Duration || 0).toFixed(2)}ms`}
          previousValue={prevStats.p99Duration}
          loading={statsLoading}
          icon="p99"
          onClick={() => setShowP99Modal(true)}
        />
      </div>

      <div className="charts-grid">
        <div className="chart-card" onClick={() => openModal('duration', { data: timeSeriesData, title: 'Duration Over Time' })}>
          <h3>Avg Duration Over Time <span className="click-hint">(Click for details)</span></h3>
          <div className="line-chart-container">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={timeSeriesData}>
                <defs>
                  <linearGradient id="colorDuration" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  stroke="#9ca3af"
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                  axisLine={{ stroke: '#374151' }}
                />
                <YAxis 
                  stroke="#9ca3af"
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                  axisLine={{ stroke: '#374151' }}
                  tickFormatter={(value) => `${value}ms`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', padding: '12px' }}
                  formatter={(value) => [`${value}ms`, 'Duration']}
                />
                <Area 
                  type="monotone" 
                  dataKey="duration" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorDuration)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="line-stats">
            <div className="line-stat-item">
              <span className="line-stat-label">Min</span>
              <span className="line-stat-value">{timeSeriesData.length ? Math.min(...timeSeriesData.map(d => Number(d.duration))).toFixed(2) : 0}ms</span>
            </div>
            <div className="line-stat-item">
              <span className="line-stat-label">Max</span>
              <span className="line-stat-value">{timeSeriesData.length ? Math.max(...timeSeriesData.map(d => Number(d.duration))).toFixed(2) : 0}ms</span>
            </div>
            <div className="line-stat-item">
              <span className="line-stat-label">Avg</span>
              <span className="line-stat-value">{timeSeriesData.length ? (timeSeriesData.reduce((a, b) => a + Number(b.duration), 0) / timeSeriesData.length).toFixed(2) : 0}ms</span>
            </div>
          </div>
        </div>

        <div className="chart-card" onClick={() => openModal('pie', { data: pieData, title: 'Status Distribution' })}>
          <h3>Error vs Success Rate <span className="click-hint">(Click for details)</span></h3>
          <div className="pie-chart-wrapper">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', padding: '10px' }}
                  formatter={(value) => [value, 'Count']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pie-center-label">
              <span className="pie-total">{traces.length}</span>
              <span className="pie-label">Total</span>
            </div>
          </div>
          <div className="pie-legend-custom">
            {pieData.map((item, idx) => (
              <div key={idx} className="pie-legend-item">
                <span className="pie-dot" style={{ background: COLORS[idx] }}></span>
                <span className="pie-name">{item.name}</span>
                <span className="pie-value">{item.value}</span>
                <span className="pie-percent">
                  {traces.length > 0 ? ((item.value / traces.length) * 100).toFixed(1) : 0}%
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card full-width" onClick={() => openModal('api', { data: barData, title: 'API Performance Details' })}>
          <h3>API Performance Comparison <span className="click-hint">(Click for details)</span></h3>
          <div className="bar-chart-container">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData} barCategoryGap="25%">
                <defs>
                  <linearGradient id="avgGradientBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#1d4ed8" />
                  </linearGradient>
                  <linearGradient id="p99GradientBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#6d28d9" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis 
                  dataKey="api" 
                  stroke="#9ca3af" 
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  axisLine={{ stroke: '#374151' }}
                />
                <YAxis 
                  stroke="#9ca3af" 
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  axisLine={{ stroke: '#374151' }}
                  tickFormatter={(value) => `${value}ms`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', padding: '12px' }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  formatter={(value, name) => [`${value}ms`, name === 'avg' ? 'Average' : 'P99']}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '10px' }}
                  formatter={(value) => value === 'avg' ? 'Average' : 'P99'}
                />
                <Bar 
                  dataKey="avg" 
                  name="avg" 
                  fill="url(#avgGradientBar)" 
                  radius={[8, 8, 0, 0]} 
                  maxBarSize={55}
                />
                <Bar 
                  dataKey="p99" 
                  name="p99" 
                  fill="url(#p99GradientBar)" 
                  radius={[8, 8, 0, 0]} 
                  maxBarSize={55}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bar-legend-custom">
            {barData.map((item, idx) => (
              <div key={idx} className="bar-legend-item">
                <div className="bar-api-header">
                  <span className="bar-api-name">{item.apiFull}</span>
                  <span className="bar-count">{item.count} reqs</span>
                </div>
                <div className="bar-visual">
                  <div className="bar-visual-row">
                    <span className="bar-label-avg">Avg</span>
                    <div className="bar-progress">
                      <div className="bar-progress-fill avg" style={{ width: `${Math.min((item.avg / (Math.max(...barData.map(b => Number(b.p99))) || 1)) * 100, 100)}%` }}></div>
                    </div>
                    <span className="bar-value">{item.avg}ms</span>
                  </div>
                  <div className="bar-visual-row">
                    <span className="bar-label-p99">P99</span>
                    <div className="bar-progress">
                      <div className="bar-progress-fill p99" style={{ width: `${Math.min((item.p99 / (Math.max(...barData.map(b => Number(b.p99))) || 1)) * 100, 100)}%` }}></div>
                    </div>
                    <span className="bar-value">{item.p99}ms</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card full-width">
          <h3>Heatmap - Activity by Hour & Status</h3>
          <div className="heatmap-container">
            {(() => {
              const hours = Array.from({ length: 24 }, (_, i) => i);
              const allCounts = traces.map(t => new Date(t.startTime).getHours());
              const maxCount = Math.max(...hours.map(h => allCounts.filter(x => x === h).length), 1);
              
              const getHeatColor = (count) => {
                if (count === 0) return 'rgba(203, 213, 225, 0.3)';
                const intensity = count / maxCount;
                if (intensity < 0.2) return `rgba(59, 130, 246, ${0.2 + intensity})`;
                if (intensity < 0.4) return `rgba(34, 197, 94, ${0.3 + intensity})`;
                if (intensity < 0.6) return `rgba(234, 179, 8, ${0.4 + intensity})`;
                if (intensity < 0.8) return `rgba(249, 115, 22, ${0.5 + intensity})`;
                return `rgba(239, 68, 68, ${0.6 + intensity * 0.4})`;
              };

              return (
                <div className="heatmap-grid">
                  <div className="heatmap-y-labels">
                    {['ok', 'error', 'client_error'].map(s => (
                      <div key={s} className="heatmap-y-label">
                        {s === 'ok' ? 'Success' : s === 'error' ? 'Error' : 'Client Error'}
                      </div>
                    ))}
                  </div>
                  <div className="heatmap-main">
                    <div className="heatmap-x-labels">
                      {hours.filter((_, i) => i % 3 === 0).map(h => (
                        <div key={h} className="heatmap-x-label">{h}:00</div>
                      ))}
                    </div>
                    <div className="heatmap-cells">
                      {['ok', 'error', 'client_error'].map(status => (
                        <div key={status} className="heatmap-row">
                          {hours.map(hour => {
                            const count = traces.filter(t => 
                              new Date(t.startTime).getHours() === hour && t.status === status
                            ).length;
                            return (
                              <div 
                                key={`${status}-${hour}`}
                                className="heatmap-cell"
                                style={{ backgroundColor: getHeatColor(count) }}
                                title={`${hour}:00 - ${status}: ${count} requests`}
                              >
                                {count > 0 && <span className="heatmap-cell-value">{count}</span>}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
          <div className="heatmap-legend">
            <span className="heatmap-legend-label">Low</span>
            <div className="heatmap-legend-gradient"></div>
            <span className="heatmap-legend-label">High</span>
          </div>
        </div>
      </div>

      {modalType && modalData && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>&times;</button>
            <h2>{modalData.title}</h2>
            
            {modalType === 'duration' && (
              <div className="modal-table-container">
                <table className="modal-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Duration (ms)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalData.data.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.time}</td>
                        <td>{item.duration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {modalType === 'pie' && (
              <div className="modal-table-container">
                <table className="modal-table">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Count</th>
                      <th>Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalData.data.map((item, idx) => (
                      <tr key={idx}>
                        <td>
                          <span className="status-dot" style={{ background: COLORS[idx] }}></span>
                          {item.name}
                        </td>
                        <td>{item.value}</td>
                        <td>{traces.length > 0 ? ((item.value / traces.length) * 100).toFixed(2) : 0}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {modalType === 'api' && (
              <div className="modal-table-container">
                <table className="modal-table">
                  <thead>
                    <tr>
                      <th>API</th>
                      <th>Requests</th>
                      <th>Avg (ms)</th>
                      <th>P99 (ms)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {barData.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.apiFull}</td>
                        <td>{item.count}</td>
                        <td>{item.avg}</td>
                        <td>{item.p99}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {showTracesModal && (
        <div className="modal-overlay" onClick={() => setShowTracesModal(false)}>
          <div className="traces-modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowTracesModal(false)}>&times;</button>
            <h2>All Traces</h2>
            
            <div className="traces-summary-grid">
              <div className="traces-summary-card total">
                <div className="traces-summary-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <div className="traces-summary-content">
                  <div className="traces-summary-label">Total Traces</div>
                  <div className="traces-summary-value">{traces.length}</div>
                </div>
              </div>
              <div className="traces-summary-card success">
                <div className="traces-summary-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <div className="traces-summary-content">
                  <div className="traces-summary-label">Pass Traces</div>
                  <div className="traces-summary-value">{traces.filter(t => t.status === 'ok').length}</div>
                </div>
              </div>
              <div className="traces-summary-card danger">
                <div className="traces-summary-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                </div>
                <div className="traces-summary-content">
                  <div className="traces-summary-label">Fail Traces</div>
                  <div className="traces-summary-value">{traces.filter(t => t.status === 'error' || t.status === 'server_error' || t.status === 'client_error').length}</div>
                </div>
              </div>
            </div>
            
            <div className="traces-modal-table">
              {tracesLoading ? (
                <div className="loading">Loading traces...</div>
              ) : traces.length === 0 ? (
                <div className="empty-state">No traces found</div>
              ) : (
                <table className="modal-table">
                  <thead>
                    <tr>
                      <th>Trace ID</th>
                      <th>Operation</th>
                      <th>Duration</th>
                      <th>Status</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {traces.map((trace) => (
                      <tr key={trace.spanId}>
                        <td><code>{trace.traceId?.substring(0, 8)}...</code></td>
                        <td>{trace.operationName}</td>
                        <td>{trace.duration?.toFixed(2)}ms</td>
                        <td>
                          <span className={`status-badge ${trace.status === 'ok' ? 'success' : trace.status === 'error' || trace.status === 'server_error' ? 'danger' : 'warning'}`}>
                            {trace.status}
                          </span>
                        </td>
                        <td>{new Date(trace.startTime).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {showDurationModal && (
        <div className="modal-overlay" onClick={() => setShowDurationModal(false)}>
          <div className="traces-modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowDurationModal(false)}>&times;</button>
            <h2>Request Durations</h2>
            
            <div className="traces-summary-grid">
              <div className="traces-summary-card total">
                <div className="traces-summary-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <div className="traces-summary-content">
                  <div className="traces-summary-label">Total Requests</div>
                  <div className="traces-summary-value">{traces.length}</div>
                </div>
              </div>
              <div className="traces-summary-card success">
                <div className="traces-summary-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                  </svg>
                </div>
                <div className="traces-summary-content">
                  <div className="traces-summary-label">Avg Duration</div>
                  <div className="traces-summary-value">{(stats?.avgDuration || 0).toFixed(2)}ms</div>
                </div>
              </div>
              <div className="traces-summary-card danger">
                <div className="traces-summary-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 17l5-5-5-5M6 17l5-5-5-5"/>
                  </svg>
                </div>
                <div className="traces-summary-content">
                  <div className="traces-summary-label">P99 Duration</div>
                  <div className="traces-summary-value">{(stats?.p99Duration || 0).toFixed(2)}ms</div>
                </div>
              </div>
            </div>
            
            <div className="traces-modal-table">
              {tracesLoading ? (
                <div className="loading">Loading...</div>
              ) : traces.length === 0 ? (
                <div className="empty-state">No traces found</div>
              ) : (
                <table className="modal-table">
                  <thead>
                    <tr>
                      <th>Trace ID</th>
                      <th>Operation</th>
                      <th>Duration (ms)</th>
                      <th>Status</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...traces].sort((a, b) => (b.duration || 0) - (a.duration || 0)).map((trace) => (
                      <tr key={trace.spanId}>
                        <td><code>{trace.traceId?.substring(0, 8)}...</code></td>
                        <td>{trace.operationName}</td>
                        <td className="duration-cell">{(trace.duration || 0).toFixed(2)}</td>
                        <td>
                          <span className={`status-badge ${trace.status === 'ok' ? 'success' : trace.status === 'error' || trace.status === 'server_error' ? 'danger' : 'warning'}`}>
                            {trace.status}
                          </span>
                        </td>
                        <td>{new Date(trace.startTime).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {showErrorRateModal && (
        <div className="modal-overlay" onClick={() => setShowErrorRateModal(false)}>
          <div className="traces-modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowErrorRateModal(false)}>&times;</button>
            <h2>Error Traces</h2>
            
            <div className="traces-summary-grid">
              <div className="traces-summary-card total">
                <div className="traces-summary-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <div className="traces-summary-content">
                  <div className="traces-summary-label">Total Traces</div>
                  <div className="traces-summary-value">{traces.length}</div>
                </div>
              </div>
              <div className="traces-summary-card success">
                <div className="traces-summary-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <div className="traces-summary-content">
                  <div className="traces-summary-label">Success</div>
                  <div className="traces-summary-value">{traces.filter(t => t.status === 'ok').length}</div>
                </div>
              </div>
              <div className="traces-summary-card danger">
                <div className="traces-summary-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                </div>
                <div className="traces-summary-content">
                  <div className="traces-summary-label">Error Rate</div>
                  <div className="traces-summary-value">{((stats?.errorCount || 0) / (stats?.totalTraces || 1) * 100).toFixed(2)}%</div>
                </div>
              </div>
            </div>
            
            <div className="traces-modal-table">
              {tracesLoading ? (
                <div className="loading">Loading...</div>
              ) : traces.filter(t => t.status !== 'ok').length === 0 ? (
                <div className="empty-state">No error traces found</div>
              ) : (
                <table className="modal-table">
                  <thead>
                    <tr>
                      <th>Trace ID</th>
                      <th>Operation</th>
                      <th>Duration</th>
                      <th>Status</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {traces.filter(t => t.status !== 'ok').map((trace) => (
                      <tr key={trace.spanId}>
                        <td><code>{trace.traceId?.substring(0, 8)}...</code></td>
                        <td>{trace.operationName}</td>
                        <td className="duration-cell">{(trace.duration || 0).toFixed(2)}ms</td>
                        <td>
                          <span className={`status-badge ${trace.status === 'error' || trace.status === 'server_error' ? 'danger' : 'warning'}`}>
                            {trace.status}
                          </span>
                        </td>
                        <td>{new Date(trace.startTime).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {showP99Modal && (
        <div className="modal-overlay" onClick={() => setShowP99Modal(false)}>
          <div className="traces-modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowP99Modal(false)}>&times;</button>
            <h2>P99 Duration - Slowest Requests</h2>
            
            <div className="traces-summary-grid">
              <div className="traces-summary-card total">
                <div className="traces-summary-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                  </svg>
                </div>
                <div className="traces-summary-content">
                  <div className="traces-summary-label">Total Requests</div>
                  <div className="traces-summary-value">{traces.length}</div>
                </div>
              </div>
              <div className="traces-summary-card success">
                <div className="traces-summary-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 17l5-5-5-5M6 17l5-5-5-5"/>
                  </svg>
                </div>
                <div className="traces-summary-content">
                  <div className="traces-summary-label">Avg Duration</div>
                  <div className="traces-summary-value">{(stats?.avgDuration || 0).toFixed(2)}ms</div>
                </div>
              </div>
              <div className="traces-summary-card danger">
                <div className="traces-summary-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 17l5-5-5-5M6 17l5-5-5-5"/>
                  </svg>
                </div>
                <div className="traces-summary-content">
                  <div className="traces-summary-label">P99 Duration</div>
                  <div className="traces-summary-value">{(stats?.p99Duration || 0).toFixed(2)}ms</div>
                </div>
              </div>
            </div>
            
            <div className="traces-modal-table">
              {tracesLoading ? (
                <div className="loading">Loading...</div>
              ) : traces.length === 0 ? (
                <div className="empty-state">No traces found</div>
              ) : (
                <table className="modal-table">
                  <thead>
                    <tr>
                      <th>Trace ID</th>
                      <th>Operation</th>
                      <th>Duration (ms)</th>
                      <th>Status</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...traces].sort((a, b) => (b.duration || 0) - (a.duration || 0)).slice(0, Math.ceil(traces.length * 0.01)).map((trace) => (
                      <tr key={trace.spanId}>
                        <td><code>{trace.traceId?.substring(0, 8)}...</code></td>
                        <td>{trace.operationName}</td>
                        <td className="duration-cell">{(trace.duration || 0).toFixed(2)}</td>
                        <td>
                          <span className={`status-badge ${trace.status === 'ok' ? 'success' : trace.status === 'error' || trace.status === 'server_error' ? 'danger' : 'warning'}`}>
                            {trace.status}
                          </span>
                        </td>
                        <td>{new Date(trace.startTime).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      <footer className="dashboard-footer">
        <p>Distributed Tracing System &copy; 2026 | Dashboard</p>
      </footer>
    </div>
  );
}
