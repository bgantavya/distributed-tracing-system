import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { TracingProvider } from './context/TracingContext';
import { ThemeProvider } from './context/ThemeContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import Landing from './components/Auth/Landing';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import Profile from './components/Auth/Profile';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Dashboard from './components/Dashboard/Dashboard';
import TracesPage from './components/Dashboard/TracesPage';
import TraceViewer from './components/TraceViewer/TraceViewer';
import DelayTest from './components/TestComponents/DelayTest';
import StatusTest from './components/TestComponents/StatusTest';
import ProxyTest from './components/TestComponents/ProxyTest';
import LogsViewer from './components/TestComponents/LogsViewer';
import { AiOutlineDashboard, AiOutlineExperiment, AiOutlineCheckCircle, AiOutlineApi, AiOutlineFileText, AiOutlineHistory, AiOutlineUser } from 'react-icons/ai';
import { useState, useEffect } from 'react';
import './App.css';

function AppLayout({ children }) {
  const [sidebarUser, setSidebarUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setSidebarUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
    const handleUserUpdate = () => {
      const updatedUser = localStorage.getItem('user');
      if (updatedUser) {
        try {
          setSidebarUser(JSON.parse(updatedUser));
        } catch (e) {
          localStorage.removeItem('user');
        }
      }
    };
    window.addEventListener('userUpdated', handleUserUpdate);
    return () => window.removeEventListener('userUpdated', handleUserUpdate);
  }, []);

  return (
    <div className="app">
      <aside className="app-sidebar">
        <div className="sidebar-header">
          <h2>Tracing UI</h2>
        </div>
        <nav className="sidebar-nav">
          <Link to="/dashboard"><AiOutlineDashboard /><span>Dashboard</span></Link>
          <Link to="/traces"><AiOutlineHistory /><span>Recent Traces</span></Link>
          <Link to="/test/delay"><AiOutlineExperiment /><span>Delay Test</span></Link>
          <Link to="/test/status"><AiOutlineCheckCircle /><span>Status Test</span></Link>
          <Link to="/test/proxy"><AiOutlineApi /><span>Proxy Test</span></Link>
          <Link to="/logs"><AiOutlineFileText /><span>Logs</span></Link>
          <Link to="/profile" className="sidebar-profile-link">
            <div className="sidebar-user-avatar">
              {sidebarUser?.avatar ? (
                <img src={sidebarUser.avatar} alt={sidebarUser.name} />
              ) : (
                <span>{sidebarUser?.name?.charAt(0).toUpperCase() || 'U'}</span>
              )}
            </div>
            <span>{sidebarUser?.name || 'Profile'}</span>
          </Link>
        </nav>
      </aside>
      <main className="app-main">{children}</main>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <TracingProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <AppLayout><Dashboard /></AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/traces" element={
                <ProtectedRoute>
                  <AppLayout><TracesPage /></AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/trace/:traceId" element={
                <ProtectedRoute>
                  <AppLayout><TraceViewer /></AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/test/delay" element={
                <ProtectedRoute>
                  <AppLayout><DelayTest /></AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/test/status" element={
                <ProtectedRoute>
                  <AppLayout><StatusTest /></AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/test/proxy" element={
                <ProtectedRoute>
                  <AppLayout><ProxyTest /></AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/logs" element={
                <ProtectedRoute>
                  <AppLayout><LogsViewer /></AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <AppLayout><Profile /></AppLayout>
                </ProtectedRoute>
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </TracingProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
