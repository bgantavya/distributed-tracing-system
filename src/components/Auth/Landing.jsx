import { useNavigate } from 'react-router-dom';
import Particles from './Particles';
import './Landing.css';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <div className="landing-background">
        <Particles
          particleColors={["#ffffff"]}
          particleCount={200}
          particleSpread={10}
          speed={0.5}
          particleBaseSize={2}
          moveParticlesOnHover
          alphaParticles={false}
          disableRotation={false}
          pixelRatio={1}
        />
      </div>
      <div className="landing-content">
        <div className="landing-hero">
          <div className="landing-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h1>Distributed Tracing System</h1>
          <p>Monitor, analyze, and optimize your microservices with real-time distributed tracing</p>
        </div>

        <div className="landing-features">
          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <h3>Real-time Tracing</h3>
            <p>Track requests across all your microservices in real-time</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 17l5-5-5-5M6 17l5-5-5-5"/>
              </svg>
            </div>
            <h3>Performance Metrics</h3>
            <p>View avg, p99 duration and error rates at a glance</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M3 9h18M9 21V9"/>
              </svg>
            </div>
            <h3>Heatmap Analysis</h3>
            <p>Visualize request patterns with interactive heatmaps</p>
          </div>
        </div>

        <div className="landing-actions">
          <button className="btn-primary" onClick={() => navigate('/login')}>
            Get Started
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="landing-footer">
        <p>Distributed Tracing System &copy; 2026 </p>
      </div>
    </div>
  );
}
