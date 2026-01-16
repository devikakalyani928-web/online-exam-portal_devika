import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardRoute } from '../utils/roleRoutes';

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
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Frontend Running</h1>
      <p>Welcome to the Online Exam Portal demo.</p>
      {!user && (
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </div>
      )}
    </div>
  );
};

export default Home;

