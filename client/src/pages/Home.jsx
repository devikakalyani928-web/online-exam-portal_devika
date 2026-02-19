import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardRoute } from '../utils/roleRoutes';
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
      <div className="auth-container">
        <div className="loading-spinner">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      {/* Custom Navigation Bar */}
      <nav className="home-navbar">
        <div className="home-navbar-container">
          <Link to="/" className="home-navbar-brand">
            <i className="bi bi-mortarboard-fill"></i>
            Online Exam Portal
          </Link>
          <div className="home-navbar-actions">
            <Link to="/login" className="home-navbar-login-btn">
              <i className="bi bi-box-arrow-in-right"></i>
              Login
            </Link>
            <Link to="/register" className="home-navbar-register-btn">
              <i className="bi bi-person-plus"></i>
              Register
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="home-hero-wrapper">
        <div className="home-hero-card">
          <div className="home-hero-icon">
            <i className="bi bi-mortarboard-fill"></i>
          </div>
          <h1 className="home-hero-heading">Online Exam Portal</h1>
          <p className="home-hero-subtitle">
            Streamline your examination process with our automated online testing platform
          </p>
          <div className="home-hero-actions">
            <Link to="/login" className="btn home-hero-btn-primary">
              <i className="bi bi-box-arrow-in-right"></i>
              Sign In
            </Link>
            <Link to="/register" className="btn home-hero-btn-outline">
              <i className="bi bi-person-plus"></i>
              Get Started
            </Link>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="home-features-section">
        <div className="home-features-container">
          <div className="home-feature-card">
            <div className="home-feature-icon-wrapper">
              <i className="bi bi-shield-lock-fill"></i>
            </div>
            <h3 className="home-feature-title">Secure</h3>
            <p className="home-feature-description">
              Your data is protected with industry-standard security measures
            </p>
          </div>
          <div className="home-feature-card">
            <div className="home-feature-icon-wrapper home-feature-icon-fast">
              <i className="bi bi-lightning-fill"></i>
            </div>
            <h3 className="home-feature-title">Fast</h3>
            <p className="home-feature-description">
              Instant evaluation and real-time results for quick feedback
            </p>
          </div>
          <div className="home-feature-card">
            <div className="home-feature-icon-wrapper home-feature-icon-efficient">
              <i className="bi bi-graph-up-arrow"></i>
            </div>
            <h3 className="home-feature-title">Efficient</h3>
            <p className="home-feature-description">
              Automated processes save time and reduce manual errors
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

