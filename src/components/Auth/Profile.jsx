import { useState, useEffect, useRef } from 'react';
import './Profile.css';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setName(parsedUser.name || '');
        setEmail(parsedUser.email || '');
      } catch (e) {
        window.location.href = '/';
      }
    } else {
      window.location.href = '/';
    }
  }, []);

  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Image = reader.result;
        const updatedUser = { ...user, avatar: base64Image };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        window.dispatchEvent(new Event('userUpdated'));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/api/auth/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name })
      });

      const data = await res.json();

      if (res.ok) {
        const updatedUser = { ...user, name };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setSuccess('Profile updated successfully!');
      } else {
        setError(data.message || 'Update failed');
      }
    } catch (err) {
      setError('Server error. Please try again.');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  if (!user) {
    return <div className="profile-page"><div className="loading">Loading...</div></div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <h1>Profile</h1>
          <p>Manage your account information</p>
        </div>

        <div className="profile-card">
          <div className="profile-avatar" onClick={handleAvatarClick}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              style={{ display: 'none' }}
            />
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} />
            ) : (
              <div className="avatar-placeholder">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            <div className="avatar-overlay">
              <span>Change Photo</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="profile-form">
            {success && <div className="profile-success">{success}</div>}
            {error && <div className="profile-error">{error}</div>}

            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                required
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                disabled
                className="disabled-input"
              />
              <span className="input-hint">Email cannot be changed</span>
            </div>

            <button type="submit" className="profile-btn" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        <div className="profile-info">
          <h3>Account Information</h3>
          <div className="info-row">
            <span className="info-label">Account Type</span>
            <span className="info-value">
              {user.googleId ? 'Google Account' : 'Email Account'}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">User ID</span>
            <span className="info-value">{user._id || user.id}</span>
          </div>
        </div>

        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>

        <footer className="dashboard-footer">
          <p>Distributed Tracing System &copy; 2026 | Profile</p>
        </footer>
      </div>
    </div>
  );
}
