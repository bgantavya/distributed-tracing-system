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
