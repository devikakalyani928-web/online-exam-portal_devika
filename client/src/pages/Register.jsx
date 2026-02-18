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
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateUsername = (username) => {
    // Only letters, underscore, and full stop - no spaces, no digits, no other characters
    const usernameRegex = /^[a-zA-Z._]+$/;
    if (!usernameRegex.test(username)) {
      return 'Username can only contain letters, underscore (_), and full stop (.). No spaces, digits, or other characters allowed.';
    }
    return '';
  };

  const validateFullName = (fullName) => {
    // Name only with spaces if needed - letters and spaces
    const fullNameRegex = /^[a-zA-Z\s]+$/;
    if (!fullNameRegex.test(fullName)) {
      return 'Full name can only contain letters and spaces.';
    }
    if (fullName.trim().length < 2) {
      return 'Full name must be at least 2 characters long.';
    }
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
    
    // Real-time validation
    if (name === 'username') {
      const usernameError = validateUsername(value);
      if (usernameError) {
        setErrors({ ...errors, username: usernameError });
      } else {
        const newErrors = { ...errors };
        delete newErrors.username;
        setErrors(newErrors);
      }
    } else if (name === 'full_name') {
      const fullNameError = validateFullName(value);
      if (fullNameError) {
        setErrors({ ...errors, full_name: fullNameError });
      } else {
        const newErrors = { ...errors };
        delete newErrors.full_name;
        setErrors(newErrors);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate all fields
    const validationErrors = {};
    const usernameError = validateUsername(form.username);
    if (usernameError) {
      validationErrors.username = usernameError;
    }
    
    const fullNameError = validateFullName(form.full_name);
    if (fullNameError) {
      validationErrors.full_name = fullNameError;
    }
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
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
              Username
            </label>
            <input
              type="text"
              className={`form-control ${errors.username ? 'is-invalid' : ''}`}
              id="username"
              name="username"
              placeholder="Choose a username (letters, _, . only)"
              value={form.username}
              onChange={handleChange}
              required
            />
            {errors.username && (
              <div className="invalid-feedback d-block">
                {errors.username}
              </div>
            )}
          </div>

          <div className="mb-3">
            <label htmlFor="full_name" className="form-label">
              Full Name
            </label>
            <input
              type="text"
              className={`form-control ${errors.full_name ? 'is-invalid' : ''}`}
              id="full_name"
              name="full_name"
              placeholder="Enter your full name"
              value={form.full_name}
              onChange={handleChange}
              required
            />
            {errors.full_name && (
              <div className="invalid-feedback d-block">
                {errors.full_name}
              </div>
            )}
          </div>

          <div className="mb-3">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
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

          <div className="mb-3">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <div className="input-group">
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                id="password"
                name="password"
                placeholder="Create a password"
                value={form.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
              </button>
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="role" className="form-label">
              Role
            </label>
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

