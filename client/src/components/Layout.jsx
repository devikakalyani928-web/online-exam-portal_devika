import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Layout.css';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();

  const getRoleIcon = (role) => {
    switch (role) {
      case 'System Admin':
        return 'bi-shield-check';
      case 'Exam Manager':
        return 'bi-file-earmark-text';
      case 'Question Manager':
        return 'bi-question-circle';
      case 'Result Manager':
        return 'bi-clipboard-data';
      case 'Student':
        return 'bi-person';
      default:
        return 'bi-person';
    }
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-custom">
        <div className="container-fluid">
          <Link to="/" className="navbar-brand-custom">
            <i className="bi bi-mortarboard-fill"></i>
            <span>Online Exam Portal</span>
          </Link>
          
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
            style={{ 
              border: '1px solid rgba(255, 255, 255, 0.3)', 
              color: 'white',
              padding: '0.25rem 0.5rem'
            }}
          >
            <i className="bi bi-list" style={{ fontSize: '1.5rem' }}></i>
          </button>
          
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav-custom ms-auto">
              {!user ? (
                <>
                  <li>
                    <Link to="/login" className="nav-link-custom">
                      <i className="bi bi-box-arrow-in-right"></i>
                      <span>Login</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/register" className="nav-link-custom">
                      <i className="bi bi-person-plus"></i>
                      <span>Register</span>
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <div className="user-info">
                      <div className="user-name">
                        <i className={`bi ${getRoleIcon(user.role)}`}></i>
                        <span>{user.full_name}</span>
                        <span className="role-badge-nav">{user.role}</span>
                      </div>
                    </div>
                  </li>
                  <li>
                    <button onClick={logout} className="btn logout-btn-custom">
                      <i className="bi bi-box-arrow-right"></i>
                      <span>Logout</span>
                    </button>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>
      <main className="main-content">
        <div className="container-fluid">
          {children}
        </div>
      </main>
    </>
  );
};

export default Layout;

