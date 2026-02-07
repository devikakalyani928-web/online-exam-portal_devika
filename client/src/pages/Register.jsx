import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardRoute } from '../utils/roleRoutes';
import '../styles/Auth.css';

const roles = ['Student', 'System Admin', 'Exam Manager', 'Question Manager', 'Result Manager'];

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    full_name: '',
    email: '',
    password: '',
    role: 'Student',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const userData = await register(form);
      // Redirect to role-specific dashboard
      const dashboardRoute = getDashboardRoute(userData.role);
      navigate(dashboardRoute);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <i className="bi bi-person-plus"></i>
          <h2>Create Account</h2>
          <p>Join the Online Exam Portal today</p>
        </div>

        {error && (
          <div className="alert alert-danger auth-alert" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="mb-3">
            <label htmlFor="username" className="form-label">
              <i className="bi bi-person me-2"></i>Username
            </label>
            <div className="input-group">
              <i className="bi bi-person"></i>
              <input
                type="text"
                className="form-control"
                id="username"
                name="username"
                placeholder="Choose a username"
                value={form.username}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="full_name" className="form-label">
              <i className="bi bi-person-badge me-2"></i>Full Name
            </label>
            <div className="input-group">
              <i className="bi bi-person-badge"></i>
              <input
                type="text"
                className="form-control"
                id="full_name"
                name="full_name"
                placeholder="Enter your full name"
                value={form.full_name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="email" className="form-label">
              <i className="bi bi-envelope me-2"></i>Email Address
            </label>
            <div className="input-group">
              <i className="bi bi-envelope"></i>
              <input
                type="email"
                className="form-control"
                id="email"
                name="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="form-label">
              <i className="bi bi-lock me-2"></i>Password
            </label>
            <div className="input-group">
              <i className="bi bi-lock"></i>
              <input
                type="password"
                className="form-control"
                id="password"
                name="password"
                placeholder="Create a password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="role" className="form-label">
              <i className="bi bi-person-badge me-2"></i>Role
            </label>
            <div className="input-group">
              <i className={`bi ${getRoleIcon(form.role)}`}></i>
              <select
                className="form-select"
                id="role"
                name="role"
                value={form.role}
                onChange={handleChange}
              >
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button type="submit" className="btn auth-submit-btn" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Registering...
              </>
            ) : (
              <>
                <i className="bi bi-person-plus me-2"></i>
                Create Account
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p className="mb-0">
            Already have an account? <Link to="/login">Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;

