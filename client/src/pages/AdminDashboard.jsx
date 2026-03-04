import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../utils/api';
import '../styles/AdminDashboard.css';

const NAV_ITEMS = [
  { key: 'stats',    icon: 'bi-grid-1x2-fill',           label: 'Dashboard' },
  { key: 'users',    icon: 'bi-people-fill',              label: 'Users' },
  { key: 'exams',    icon: 'bi-file-earmark-text-fill',   label: 'Examinations' },
  { key: 'results',  icon: 'bi-clipboard-data-fill',      label: 'Results' },
  { key: 'feedback', icon: 'bi-chat-left-text-fill',      label: 'Feedback' },
];

const AdminDashboard = () => {
  const { token, user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('stats');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Users state
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userForm, setUserForm] = useState({
    username: '',
    full_name: '',
    email: '',
    password: '',
    role: 'Student',
  });
  const [editingUserId, setEditingUserId] = useState(null);
  const [userFormErrors, setUserFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  // Exams state
  const [exams, setExams] = useState([]);
  const [examsLoading, setExamsLoading] = useState(true);

  // Results state
  const [results, setResults] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(true);

  // Stats state
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Feedback state
  const [feedback, setFeedback] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replying, setReplying] = useState(false);

  const [error, setError] = useState('');

  /* ───── Data fetchers ───── */

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const res = await fetch(`${API_BASE}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load users');
      const data = await res.json();
      setUsers(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchExams = async () => {
    try {
      setExamsLoading(true);
      const res = await fetch(`${API_BASE}/api/admin/exams`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load exams');
      const data = await res.json();
      setExams(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setExamsLoading(false);
    }
  };

  const fetchResults = async () => {
    try {
      setResultsLoading(true);
      const res = await fetch(`${API_BASE}/api/admin/results`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load results');
      const data = await res.json();
      const validResults = data.filter(
        (result) => result.student_id !== null && result.exam_id !== null
      );
      setResults(validResults);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setResultsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const res = await fetch(`${API_BASE}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load statistics');
      const data = await res.json();
      setStats(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchFeedback = async () => {
    try {
      setFeedbackLoading(true);
      const res = await fetch(`${API_BASE}/api/feedback`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load feedback');
      const data = await res.json();
      setFeedback(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setFeedbackLoading(false);
    }
  };

  const handleReply = async (feedbackId) => {
    if (!replyMessage.trim()) {
      setError('Please enter a reply message');
      return;
    }
    setReplying(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/feedback/${feedbackId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reply: replyMessage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to send reply');
      setReplyMessage('');
      setReplyingTo(null);
      fetchFeedback();
    } catch (err) {
      setError(err.message);
    } finally {
      setReplying(false);
    }
  };

  /* ───── Tab data loader ───── */

  useEffect(() => {
    if (!token) return;
    if (activeTab === 'users') fetchUsers();
    else if (activeTab === 'exams') fetchExams();
    else if (activeTab === 'results') fetchResults();
    else if (activeTab === 'stats') fetchStats();
    else if (activeTab === 'feedback') fetchFeedback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, activeTab]);

  /* ───── Validation helpers ───── */

  const validateUsername = (username) => {
    // Allow letters, numbers, underscore (_), and dot (.)
    const re = /^[a-zA-Z0-9._]+$/;
    if (!re.test(username))
      return 'Username can only contain letters, numbers, underscore (_), and dot (.). No spaces or other symbols allowed.';
    return '';
  };

  const validateFullName = (fullName) => {
    const re = /^[a-zA-Z\s]+$/;
    if (!re.test(fullName)) return 'Full name can only contain letters and spaces.';
    if (fullName.trim().length < 2) return 'Full name must be at least 2 characters long.';
    return '';
  };

  /* ───── Form handlers ───── */

  const handleUserFormChange = (e) => {
    const { name, value } = e.target;
    setUserForm({ ...userForm, [name]: value });

    if (userFormErrors[name]) {
      setUserFormErrors({ ...userFormErrors, [name]: '' });
    }

    if (name === 'username') {
      const err = validateUsername(value);
      if (err) setUserFormErrors({ ...userFormErrors, username: err });
      else {
        const copy = { ...userFormErrors };
        delete copy.username;
        setUserFormErrors(copy);
      }
    } else if (name === 'full_name') {
      const err = validateFullName(value);
      if (err) setUserFormErrors({ ...userFormErrors, full_name: err });
      else {
        const copy = { ...userFormErrors };
        delete copy.full_name;
        setUserFormErrors(copy);
      }
    }
  };

  const handleEditUser = (u) => {
    setEditingUserId(u._id);
    setUserForm({
      username: u.username,
      full_name: u.full_name,
      email: u.email,
      password: '',
      role: u.role,
    });
    setUserFormErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setUserForm({ username: '', full_name: '', email: '', password: '', role: 'Student' });
    setUserFormErrors({});
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');

    const validationErrors = {};
    const ue = validateUsername(userForm.username);
    if (ue) validationErrors.username = ue;
    const fe = validateFullName(userForm.full_name);
    if (fe) validationErrors.full_name = fe;

    if (Object.keys(validationErrors).length > 0) {
      setUserFormErrors(validationErrors);
      return;
    }

    try {
      if (editingUserId) {
        const updateData = {
          username: userForm.username,
          full_name: userForm.full_name,
          email: userForm.email,
          role: userForm.role,
        };
        if (userForm.password.trim()) updateData.password = userForm.password;

        const res = await fetch(`${API_BASE}/api/users/${editingUserId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(updateData),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.message || body?.errors?.[0]?.msg || 'Failed to update user');
        }
        setEditingUserId(null);
      } else {
        const res = await fetch(`${API_BASE}/api/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(userForm),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.message || body?.errors?.[0]?.msg || 'Failed to create user');
        }
      }
      setUserForm({ username: '', full_name: '', email: '', password: '', role: 'Student' });
      setUserFormErrors({});
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete user');
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  /* ═══════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════ */

  return (
    <div className="admin-dashboard">
      {/* ── Background blobs ── */}
      <div className="admin-bg-effects">
        <div className="admin-blob admin-blob-1" />
        <div className="admin-blob admin-blob-2" />
        <div className="admin-blob admin-blob-3" />
      </div>

      {/* ── Sidebar ── */}
      <aside className={`admin-sidebar ${!sidebarOpen ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <i className="bi bi-shield-check-fill" />
            <span className="sidebar-logo-text">Admin Panel</span>
          </div>
          {sidebarOpen && (
            <button className="sidebar-toggle" onClick={() => setSidebarOpen(false)}>
              <i className="bi bi-chevron-left" />
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              className={`sidebar-nav-item ${activeTab === item.key ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(item.key);
                if (window.innerWidth < 768) setSidebarOpen(false);
              }}
              title={!sidebarOpen ? item.label : undefined}
            >
              <i className={`bi ${item.icon}`} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            className="sidebar-nav-item sidebar-logout-btn"
            onClick={logout}
            title={!sidebarOpen ? 'Logout' : undefined}
          >
            <i className="bi bi-box-arrow-left" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Mobile overlay ── */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ── Main area ── */}
      <div className={`admin-main ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
        {/* Top bar */}
        <header className="admin-topbar">
          {!sidebarOpen && (
            <button className="sidebar-expand-btn" onClick={() => setSidebarOpen(true)}>
              <i className="bi bi-chevron-right" />
            </button>
          )}
          <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
            <i className="bi bi-list" />
          </button>
          <div className="topbar-title">
            <h1>{NAV_ITEMS.find((n) => n.key === activeTab)?.label}</h1>
          </div>
          <div className="topbar-actions">
            <div className="topbar-user-chip">
              <div className="topbar-avatar" title={user?.full_name || 'Admin'}>
                {user?.full_name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <div className="topbar-user-info">
                <span className="topbar-username">{user?.full_name || 'Admin'}</span>
                <span className="topbar-role">{user?.role}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="admin-content">
          {/* Error alert */}
          {error && (
            <div className="admin-alert admin-alert-danger">
              <i className="bi bi-exclamation-triangle-fill" />
              <span>{error}</span>
              <button onClick={() => setError('')}>
                <i className="bi bi-x-lg" />
              </button>
            </div>
          )}

          {/* ═══ STATS TAB ═══ */}
          {activeTab === 'stats' && (
            <div>
              {statsLoading ? (
                <div className="admin-loading"><div className="admin-spinner" /></div>
              ) : stats ? (
                <div className="admin-stats-grid">
                  {/* Users */}
                  <div className="admin-stat-card">
                    <div className="admin-stat-card-header">
                      <div className="admin-stat-card-icon primary"><i className="bi bi-people-fill" /></div>
                      <span className="admin-stat-card-title">Users</span>
                    </div>
                    <div className="admin-stat-card-value">{stats.users.total}</div>
                    <div className="admin-stat-card-details">
                      {Object.entries(stats.users.byRole).map(([role, count]) => (
                        <div key={role} className="admin-stat-detail-row">
                          <span>{role}</span>
                          <strong>{count}</strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Examinations */}
                  <div className="admin-stat-card">
                    <div className="admin-stat-card-header">
                      <div className="admin-stat-card-icon success"><i className="bi bi-file-earmark-text-fill" /></div>
                      <span className="admin-stat-card-title">Examinations</span>
                    </div>
                    <div className="admin-stat-card-value">{stats.exams.total}</div>
                    <div className="admin-stat-card-details">
                      <div className="admin-stat-detail-row">
                        <span>Active</span>
                        <strong style={{ color: '#4ade80' }}>{stats.exams.active}</strong>
                      </div>
                      <div className="admin-stat-detail-row">
                        <span>Inactive</span>
                        <strong style={{ color: '#fca5a5' }}>{stats.exams.inactive}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Questions */}
                  <div className="admin-stat-card">
                    <div className="admin-stat-card-header">
                      <div className="admin-stat-card-icon warning"><i className="bi bi-question-circle-fill" /></div>
                      <span className="admin-stat-card-title">Questions</span>
                    </div>
                    <div className="admin-stat-card-value">{stats.questions.total}</div>
                    <p style={{ color: 'var(--text-muted)', margin: '0.75rem 0 0', fontSize: '0.85rem' }}>
                      Total questions in system
                    </p>
                  </div>

                  {/* Attempts */}
                  <div className="admin-stat-card">
                    <div className="admin-stat-card-header">
                      <div className="admin-stat-card-icon info"><i className="bi bi-clipboard-check-fill" /></div>
                      <span className="admin-stat-card-title">Exam Attempts</span>
                    </div>
                    <div className="admin-stat-card-value">{stats.attempts.total}</div>
                    <div className="admin-stat-card-details">
                      <div className="admin-stat-detail-row">
                        <span>Completed</span>
                        <strong style={{ color: '#4ade80' }}>{stats.attempts.completed}</strong>
                      </div>
                      <div className="admin-stat-detail-row">
                        <span>Pending</span>
                        <strong style={{ color: '#fbbf24' }}>{stats.attempts.pending}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Performance */}
                  <div className="admin-stat-card">
                    <div className="admin-stat-card-header">
                      <div className="admin-stat-card-icon purple"><i className="bi bi-trophy-fill" /></div>
                      <span className="admin-stat-card-title">Performance</span>
                    </div>
                    <div className="admin-stat-card-details" style={{ borderTop: 'none', paddingTop: 0, marginTop: 0 }}>
                      <div className="admin-stat-detail-row">
                        <span>Average Score</span>
                        <strong style={{ fontSize: '1.2rem' }}>{stats.performance.averageScore.toFixed(1)}</strong>
                      </div>
                      <div className="admin-stat-detail-row">
                        <span>Highest Score</span>
                        <strong style={{ fontSize: '1.2rem', color: '#4ade80' }}>{stats.performance.maxScore}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="admin-empty">
                  <i className="bi bi-exclamation-triangle" />
                  <p>Unable to load statistics.</p>
                </div>
              )}
            </div>
          )}

          {/* ═══ USERS TAB ═══ */}
          {activeTab === 'users' && (
            <div>
              {/* User form */}
              <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
                <div className="glass-card-header">
                  <h3>
                    <i className={`bi ${editingUserId ? 'bi-pencil-square' : 'bi-person-plus'}`} />
                    {editingUserId ? 'Edit User' : 'Create User'}
                  </h3>
                </div>
                <form onSubmit={handleCreateUser}>
                  <div className="admin-user-form-grid">
                    <div>
                      <label className="form-label">Username</label>
                      <input
                        type="text"
                        className={`form-control ${userFormErrors.username ? 'is-invalid' : ''}`}
                        name="username"
                        placeholder="Username (letters, numbers, _, .)"
                        value={userForm.username}
                        onChange={handleUserFormChange}
                        required
                      />
                      {userFormErrors.username && (
                        <div className="invalid-feedback d-block">{userFormErrors.username}</div>
                      )}
                    </div>
                    <div>
                      <label className="form-label">Full Name</label>
                      <input
                        type="text"
                        className={`form-control ${userFormErrors.full_name ? 'is-invalid' : ''}`}
                        name="full_name"
                        placeholder="Full name"
                        value={userForm.full_name}
                        onChange={handleUserFormChange}
                        required
                      />
                      {userFormErrors.full_name && (
                        <div className="invalid-feedback d-block">{userFormErrors.full_name}</div>
                      )}
                    </div>
                    <div>
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        name="email"
                        placeholder="Email"
                        value={userForm.email}
                        onChange={handleUserFormChange}
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label">Password</label>
                      <div className="input-group">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          className="form-control"
                          name="password"
                          placeholder={editingUserId ? 'Leave blank to keep current' : 'Password'}
                          value={userForm.password}
                          onChange={handleUserFormChange}
                          required={!editingUserId}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="form-label">Role</label>
                      <select
                        className="form-select"
                        name="role"
                        value={userForm.role}
                        onChange={handleUserFormChange}
                      >
                        <option value="Student">Student</option>
                        <option value="System Admin">System Admin</option>
                        <option value="Exam Manager">Exam Manager</option>
                        <option value="Question Manager">Question Manager</option>
                        <option value="Result Manager">Result Manager</option>
                      </select>
                    </div>
                  </div>
                  <div className="admin-form-actions">
                    <button type="submit" className={editingUserId ? 'btn-admin-success' : 'btn-admin-primary'}>
                      <i className={`bi ${editingUserId ? 'bi-check-circle' : 'bi-plus-circle'}`} />
                      {editingUserId ? 'Update User' : 'Create User'}
                    </button>
                    {editingUserId && (
                      <button type="button" className="btn-admin-secondary" onClick={handleCancelEdit}>
                        <i className="bi bi-x-circle" /> Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Users table */}
              <div className="glass-card">
                <div className="glass-card-header">
                  <h3>
                    <i className="bi bi-people-fill" />
                    Existing Users ({users.length})
                  </h3>
                </div>
                {usersLoading ? (
                  <div className="admin-loading"><div className="admin-spinner" /></div>
                ) : users.length === 0 ? (
                  <div className="admin-empty"><i className="bi bi-inbox" /><p>No users found.</p></div>
                ) : (
                  <div className="admin-table-wrapper">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Username</th>
                          <th>Full Name</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Created</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr key={u._id}>
                            <td><strong style={{ color: 'var(--text)' }}>{u.username}</strong></td>
                            <td>{u.full_name}</td>
                            <td>{u.email}</td>
                            <td><span className="admin-role-badge">{u.role}</span></td>
                            <td>{new Date(u.createdAt).toLocaleDateString('en-GB')}</td>
                            <td>
                              <div className="admin-table-actions">
                                <button className="btn-admin-primary btn-admin-sm" onClick={() => handleEditUser(u)}>
                                  <i className="bi bi-pencil" /> Edit
                                </button>
                                <button className="btn-admin-danger btn-admin-sm" onClick={() => handleDeleteUser(u._id)}>
                                  <i className="bi bi-trash" /> Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══ EXAMS TAB ═══ */}
          {activeTab === 'exams' && (
            <div className="glass-card">
              <div className="glass-card-header">
                <h3>
                  <i className="bi bi-file-earmark-text-fill" />
                  All Examinations ({exams.length})
                </h3>
              </div>
              {examsLoading ? (
                <div className="admin-loading"><div className="admin-spinner" /></div>
              ) : exams.length === 0 ? (
                <div className="admin-empty"><i className="bi bi-inbox" /><p>No exams found.</p></div>
              ) : (
                <div className="admin-table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Exam Name</th>
                        <th>Created By</th>
                        <th>Start Time</th>
                        <th>End Time</th>
                        <th>Duration (min)</th>
                        <th>Status</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exams.map((exam) => (
                        <tr key={exam._id}>
                          <td><strong style={{ color: 'var(--text)' }}>{exam.exam_name}</strong></td>
                          <td>
                            {exam.created_by?.full_name || exam.created_by?.username || 'N/A'}
                            <br />
                            <small style={{ color: 'var(--text-muted)' }}>{exam.created_by?.email}</small>
                          </td>
                          <td>{new Date(exam.start_time).toLocaleString('en-GB')}</td>
                          <td>{new Date(exam.end_time).toLocaleString('en-GB')}</td>
                          <td>{exam.duration}</td>
                          <td>
                            <span className={`admin-status-badge ${exam.is_active ? 'active' : 'inactive'}`}>
                              <i className={`bi ${exam.is_active ? 'bi-check-circle' : 'bi-x-circle'}`} />
                              {exam.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>{new Date(exam.createdAt).toLocaleDateString('en-GB')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ═══ RESULTS TAB ═══ */}
          {activeTab === 'results' && (
            <div className="glass-card">
              <div className="glass-card-header">
                <h3>
                  <i className="bi bi-clipboard-data-fill" />
                  All Exam Results ({results.length})
                </h3>
              </div>
              {resultsLoading ? (
                <div className="admin-loading"><div className="admin-spinner" /></div>
              ) : results.length === 0 ? (
                <div className="admin-empty"><i className="bi bi-inbox" /><p>No results found.</p></div>
              ) : (
                <div className="admin-table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Exam Name</th>
                        <th>Student</th>
                        <th>Email</th>
                        <th>Start Time</th>
                        <th>End Time</th>
                        <th>Score</th>
                        <th>Status</th>
                        <th>Submitted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((result) => (
                        <tr key={result._id}>
                          <td>{result.exam_id?.exam_name || 'N/A'}</td>
                          <td>{result.student_id?.full_name || result.student_id?.username || 'N/A'}</td>
                          <td>{result.student_id?.email || 'N/A'}</td>
                          <td>{new Date(result.start_time).toLocaleString('en-GB')}</td>
                          <td>{result.end_time ? new Date(result.end_time).toLocaleString('en-GB') : 'N/A'}</td>
                          <td>
                            <strong
                              className={`admin-score ${(() => {
                                if (!result.completed) return 'pending';
                                if (result.is_passed !== undefined) return result.is_passed ? 'pass' : 'fail';
                                return 'fail';
                              })()}`}
                            >
                              {result.completed ? result.total_score : '-'}
                            </strong>
                          </td>
                          <td>
                            <span className={`admin-status-badge ${result.completed ? 'completed' : 'pending'}`}>
                              <i className={`bi ${result.completed ? 'bi-check-circle' : 'bi-clock'}`} />
                              {result.completed ? 'Completed' : 'In Progress'}
                            </span>
                          </td>
                          <td>{new Date(result.createdAt).toLocaleDateString('en-GB')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ═══ FEEDBACK TAB ═══ */}
          {activeTab === 'feedback' && (
            <div className="glass-card">
              <div className="glass-card-header">
                <h3>
                  <i className="bi bi-chat-left-text-fill" />
                  Student Feedback
                </h3>
              </div>
              {feedbackLoading ? (
                <div className="admin-loading"><div className="admin-spinner" /></div>
              ) : feedback.length === 0 ? (
                <div className="admin-empty"><i className="bi bi-inbox" /><p>No feedback received yet.</p></div>
              ) : (
                <div className="admin-feedback-list">
                  {feedback.map((item) => (
                    <div key={item._id} className="admin-feedback-card">
                      <div className="admin-feedback-header">
                        <div>
                          <span className="admin-feedback-student">
                            {item.student_id?.full_name || item.student_id?.username || 'Unknown Student'}
                          </span>
                          {item.student_id?.email && (
                            <span className="admin-feedback-email">({item.student_id.email})</span>
                          )}
                        </div>
                        <div className="admin-feedback-meta">
                          <span className={`admin-feedback-badge ${item.status === 'Replied' ? 'replied' : 'pending'}`}>
                            {item.status}
                          </span>
                          <span className="admin-feedback-date">
                            {new Date(item.createdAt).toLocaleString('en-GB')}
                          </span>
                        </div>
                      </div>

                      <div className="admin-feedback-message">
                        <label>Message</label>
                        <p>{item.message}</p>
                      </div>

                      {item.reply ? (
                        <div className="admin-feedback-reply">
                          <label>Your Reply</label>
                          <p>{item.reply}</p>
                          <small>Replied on: {new Date(item.updatedAt).toLocaleString('en-GB')}</small>
                        </div>
                      ) : (
                        <div>
                          {replyingTo === item._id ? (
                            <div className="admin-reply-form">
                              <label className="form-label">Your Reply</label>
                              <textarea
                                value={replyMessage}
                                onChange={(e) => setReplyMessage(e.target.value)}
                                placeholder="Enter your reply here..."
                              />
                              <div className="admin-reply-actions">
                                <button
                                  className="btn-admin-primary btn-admin-sm"
                                  onClick={() => handleReply(item._id)}
                                  disabled={replying}
                                >
                                  {replying ? (
                                    <><span className="admin-btn-spinner" /> Sending...</>
                                  ) : (
                                    <><i className="bi bi-send" /> Reply</>
                                  )}
                                </button>
                                <button
                                  className="btn-admin-secondary btn-admin-sm"
                                  onClick={() => { setReplyingTo(null); setReplyMessage(''); }}
                                  disabled={replying}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              className="btn-admin-primary btn-admin-sm"
                              onClick={() => setReplyingTo(item._id)}
                            >
                              <i className="bi bi-reply" /> Reply
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
