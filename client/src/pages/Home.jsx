import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardRoute } from '../utils/roleRoutes';
import AuthIllustration from '../assets/AuthIllustration';
import '../styles/Auth.css';

const Home = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is logged in, redirect to their dashboard
    if (!loading && user) {
      const dashboardRoute = getDashboardRoute(user.role);
      navigate(dashboardRoute, { replace: true });
    }
  }, [user, loading, navigate]);

  // Show loading or login/register options
  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="auth-title">Welcome!</h1>
          <p className="auth-subtitle">Online Exam Portal - Streamline your examination process</p>

          <div style={{ marginTop: '2rem', marginBottom: '2rem' }}>
            <Link to="/login" className="auth-submit-btn" style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}>
              <i className="bi bi-box-arrow-in-right" style={{ marginRight: '0.5rem' }}></i>
              Sign In
            </Link>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <Link to="/register" className="auth-outline-btn">
              <i className="bi bi-person-plus"></i>
              Get Started
            </Link>
          </div>

          <div className="auth-footer">
            <span>Already have an account?</span>
            <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

