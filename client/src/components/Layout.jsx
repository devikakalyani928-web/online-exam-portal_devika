import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '1rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ textDecoration: 'none', fontWeight: 'bold', fontSize: '1.2rem' }}>
          Online Exam Portal
        </Link>
        <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
          {user && <span style={{ fontWeight: 600 }}>{user.full_name} ({user.role})</span>}
          {user && (
            <button onClick={logout} style={{ cursor: 'pointer' }}>
              Logout
            </button>
          )}
        </nav>
      </header>
      <main style={{ marginTop: '1.5rem' }}>{children}</main>
    </div>
  );
};

export default Layout;

