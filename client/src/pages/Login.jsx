import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardRoute } from '../utils/roleRoutes';
import AuthIllustration from '../assets/AuthIllustration';
import '../styles/Auth.css';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState(''); // email or username
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const userData = await login(identifier, password);
      const dashboardRoute = getDashboardRoute(userData.role);
      navigate(dashboardRoute);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Background blobs */}
      <div className="auth-blob auth-blob-1"></div>
      <div className="auth-blob auth-blob-2"></div>
      <div className="auth-blob auth-blob-3"></div>

      <div className="auth-left">
        <div className="auth-illustration">
          <AuthIllustration />
        </div>
      </div>

      <div className="auth-right">

        <div className="auth-card">
          <h1 className="auth-title">Hello!</h1>
          <p className="auth-subtitle">Sign in to your account</p>

          {error && (
            <div className="auth-error">
              <i className="bi bi-exclamation-triangle-fill"></i>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <div className="auth-input-wrapper">
                <i className="bi bi-person auth-input-icon"></i>
                <input
                  type="text"
                  placeholder="Email or Username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <div className="auth-input-wrapper">
                <i className="bi bi-lock auth-input-icon"></i>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="auth-footer">
            <span>Don&apos;t have an account?</span>
            <Link to="/register">Sign up</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

