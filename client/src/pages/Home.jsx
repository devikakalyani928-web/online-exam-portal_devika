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
    <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="home-hero">
        <i className="bi bi-mortarboard-fill" style={{ fontSize: '4rem', marginBottom: '1rem' }}></i>
        <h1>Online Exam Portal</h1>
        <p>Streamline your examination process with our automated online testing platform</p>
        {!user && (
          <div className="home-actions">
            <Link to="/login" className="btn home-action-btn home-action-btn-primary">
              <i className="bi bi-box-arrow-in-right"></i>
              Sign In
            </Link>
            <Link to="/register" className="btn home-action-btn home-action-btn-outline">
              <i className="bi bi-person-plus"></i>
              Get Started
            </Link>
          </div>
        )}
      </div>

      {!user && (
        <div className="row mt-5">
          <div className="col-md-4 mb-4">
            <div className="card h-100 text-center">
              <div className="card-body">
                <i className="bi bi-shield-check text-primary" style={{ fontSize: '2.5rem' }}></i>
                <h5 className="card-title mt-3">Secure</h5>
                <p className="card-text text-muted">Your data is protected with industry-standard security measures</p>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-4">
            <div className="card h-100 text-center">
              <div className="card-body">
                <i className="bi bi-lightning-charge text-warning" style={{ fontSize: '2.5rem' }}></i>
                <h5 className="card-title mt-3">Fast</h5>
                <p className="card-text text-muted">Instant evaluation and real-time results for quick feedback</p>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-4">
            <div className="card h-100 text-center">
              <div className="card-body">
                <i className="bi bi-graph-up text-success" style={{ fontSize: '2.5rem' }}></i>
                <h5 className="card-title mt-3">Efficient</h5>
                <p className="card-text text-muted">Automated processes save time and reduce manual errors</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;

