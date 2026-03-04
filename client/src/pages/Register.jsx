import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardRoute } from '../utils/roleRoutes';
import AuthIllustration from '../assets/AuthIllustration';
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
    // Allow letters, numbers, underscore (_), and dot (.)
    const usernameRegex = /^[a-zA-Z0-9._]+$/;
    if (!usernameRegex.test(username)) {
      return 'Username can only contain letters, numbers, underscore (_), and dot (.).';
    }
    return '';
  };

  const validateFullName = (fullName) => {
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

    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }

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

    const validationErrors = {};
    const usernameError = validateUsername(form.username);
    if (usernameError) validationErrors.username = usernameError;

    const fullNameError = validateFullName(form.full_name);
    if (fullNameError) validationErrors.full_name = fullNameError;

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const userData = await register(form);
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

        <div className="auth-card auth-card--register">
          <h1 className="auth-title">Hello!</h1>
          <p className="auth-subtitle">Create your account</p>

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
                  name="username"
                  className={errors.username ? 'is-invalid' : ''}
                  placeholder="Username"
                  value={form.username}
                  onChange={handleChange}
                  required
                />
              </div>
              {errors.username && (
                <div className="auth-field-error">{errors.username}</div>
              )}
            </div>

            <div className="auth-field">
              <div className="auth-input-wrapper">
                <i className="bi bi-person-badge auth-input-icon"></i>
                <input
                  type="text"
                  name="full_name"
                  className={errors.full_name ? 'is-invalid' : ''}
                  placeholder="Full Name"
                  value={form.full_name}
                  onChange={handleChange}
                  required
                />
              </div>
              {errors.full_name && (
                <div className="auth-field-error">{errors.full_name}</div>
              )}
            </div>

            <div className="auth-field">
              <div className="auth-input-wrapper">
                <i className="bi bi-envelope auth-input-icon"></i>
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <div className="auth-input-wrapper">
                <i className="bi bi-lock auth-input-icon"></i>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={handleChange}
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

            <div className="auth-field">
              <div className="auth-input-wrapper">
                <i className="bi bi-mortarboard auth-input-icon"></i>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                >
                  {roles.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          <div className="auth-footer">
            <span>Already have an account?</span>
            <Link to="/login">Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;

