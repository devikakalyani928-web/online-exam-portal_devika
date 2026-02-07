import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/AdminDashboard.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const AdminDashboard = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  
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
  
  // Exams state
  const [exams, setExams] = useState([]);
  const [examsLoading, setExamsLoading] = useState(true);
  
  // Results state
  const [results, setResults] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(true);
  
  // Stats state
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  
  const [error, setError] = useState('');

  // Fetch users
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

  // Fetch exams
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

  // Fetch results
  const fetchResults = async () => {
    try {
      setResultsLoading(true);
      const res = await fetch(`${API_BASE}/api/admin/results`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load results');
      const data = await res.json();
      setResults(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setResultsLoading(false);
    }
  };

  // Fetch stats
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

  // Load data based on active tab
  useEffect(() => {
    if (!token) return;
    
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'exams') {
      fetchExams();
    } else if (activeTab === 'results') {
      fetchResults();
    } else if (activeTab === 'stats') {
      fetchStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, activeTab]);

  const handleUserFormChange = (e) => {
    setUserForm({ ...userForm, [e.target.name]: e.target.value });
  };

  const handleEditUser = (user) => {
    setEditingUserId(user._id);
    setUserForm({
      username: user.username,
      full_name: user.full_name,
      email: user.email,
      password: '', // Don't pre-fill password
      role: user.role,
    });
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setUserForm({
      username: '',
      full_name: '',
      email: '',
      password: '',
      role: 'Student',
    });
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingUserId) {
        // Update existing user
        const updateData = {
          username: userForm.username,
          full_name: userForm.full_name,
          email: userForm.email,
          role: userForm.role,
        };
        // Only include password if it's provided
        if (userForm.password.trim()) {
          updateData.password = userForm.password;
        }

        const res = await fetch(`${API_BASE}/api/users/${editingUserId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updateData),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          const msg = body?.message || body?.errors?.[0]?.msg || 'Failed to update user';
          throw new Error(msg);
        }
        setEditingUserId(null);
      } else {
        // Create new user
        const res = await fetch(`${API_BASE}/api/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(userForm),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          const msg = body?.message || body?.errors?.[0]?.msg || 'Failed to create user';
          throw new Error(msg);
        }
      }
      setUserForm({
        username: '',
        full_name: '',
        email: '',
        password: '',
        role: 'Student',
      });
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

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h2><i className="bi bi-shield-check"></i> System Admin Dashboard</h2>
        <p className="text-muted">Complete control over the Online Exam Portal</p>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')} aria-label="Close"></button>
        </div>
      )}

      {/* Tabs */}
      <ul className="nav nav-tabs admin-tabs" role="tablist">
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
            type="button"
          >
            <i className="bi bi-people me-2"></i>User Management
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'exams' ? 'active' : ''}`}
            onClick={() => setActiveTab('exams')}
            type="button"
          >
            <i className="bi bi-file-earmark-text me-2"></i>All Examinations
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'results' ? 'active' : ''}`}
            onClick={() => setActiveTab('results')}
            type="button"
          >
            <i className="bi bi-clipboard-data me-2"></i>All Results
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
            type="button"
          >
            <i className="bi bi-graph-up me-2"></i>System Statistics
          </button>
        </li>
      </ul>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div>
          <div className="card user-form-card">
            <h3>
              <i className={`bi ${editingUserId ? 'bi-pencil-square' : 'bi-person-plus'} me-2`}></i>
              {editingUserId ? 'Edit User' : 'Create User'}
            </h3>
            <form onSubmit={handleCreateUser}>
              <div className="user-form-row">
                <div className="mb-3">
                  <label htmlFor="username" className="form-label">Username</label>
                  <input
                    type="text"
                    className="form-control"
                    id="username"
                    name="username"
                    placeholder="Username"
                    value={userForm.username}
                    onChange={handleUserFormChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="full_name" className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="full_name"
                    name="full_name"
                    placeholder="Full name"
                    value={userForm.full_name}
                    onChange={handleUserFormChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    name="email"
                    placeholder="Email"
                    value={userForm.email}
                    onChange={handleUserFormChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    name="password"
                    placeholder={editingUserId ? "Password (leave blank to keep current)" : "Password"}
                    value={userForm.password}
                    onChange={handleUserFormChange}
                    required={!editingUserId}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="role" className="form-label">Role</label>
                  <select
                    className="form-select"
                    id="role"
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
              <div className="user-form-actions">
                <button type="submit" className={`btn ${editingUserId ? 'btn-success' : 'btn-primary'}`}>
                  <i className={`bi ${editingUserId ? 'bi-check-circle' : 'bi-plus-circle'} me-2`}></i>
                  {editingUserId ? 'Update User' : 'Create User'}
                </button>
                {editingUserId && (
                  <button type="button" className="btn btn-secondary" onClick={handleCancelEdit}>
                    <i className="bi bi-x-circle me-2"></i>Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="mb-0">
                <i className="bi bi-people-fill me-2"></i>Existing Users ({users.length})
              </h3>
            </div>
            <div className="card-body">
              {usersLoading ? (
                <div className="loading-container">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : users.length === 0 ? (
                <div className="empty-container">
                  <i className="bi bi-inbox"></i>
                  <p>No users found.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
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
                          <td><strong>{u.username}</strong></td>
                          <td>{u.full_name}</td>
                          <td>{u.email}</td>
                          <td><span className="role-badge">{u.role}</span></td>
                          <td>{new Date(u.createdAt).toLocaleDateString('en-GB')}</td>
                          <td>
                            <div className="table-actions">
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => handleEditUser(u)}
                              >
                                <i className="bi bi-pencil me-1"></i>Edit
                              </button>
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => handleDeleteUser(u._id)}
                              >
                                <i className="bi bi-trash me-1"></i>Delete
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
        </div>
      )}

      {/* Exams Tab */}
      {activeTab === 'exams' && (
        <div>
          <div className="card">
            <div className="card-header">
              <h3 className="mb-0">
                <i className="bi bi-file-earmark-text-fill me-2"></i>All Examinations ({exams.length})
              </h3>
            </div>
            <div className="card-body">
              {examsLoading ? (
                <div className="loading-container">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : exams.length === 0 ? (
                <div className="empty-container">
                  <i className="bi bi-inbox"></i>
                  <p>No exams found.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
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
                          <td><strong>{exam.exam_name}</strong></td>
                          <td>
                            {exam.created_by?.full_name || exam.created_by?.username || 'N/A'}
                            <br />
                            <small className="text-muted">{exam.created_by?.email}</small>
                          </td>
                          <td>{new Date(exam.start_time).toLocaleString('en-GB')}</td>
                          <td>{new Date(exam.end_time).toLocaleString('en-GB')}</td>
                          <td>{exam.duration}</td>
                          <td>
                            <span className={`status-badge ${exam.is_active ? 'status-active' : 'status-inactive'}`}>
                              <i className={`bi ${exam.is_active ? 'bi-check-circle' : 'bi-x-circle'} me-1`}></i>
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
          </div>
        </div>
      )}

      {/* Results Tab */}
      {activeTab === 'results' && (
        <div>
          <div className="card">
            <div className="card-header">
              <h3 className="mb-0">
                <i className="bi bi-clipboard-data-fill me-2"></i>All Exam Results ({results.length})
              </h3>
            </div>
            <div className="card-body">
              {resultsLoading ? (
                <div className="loading-container">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : results.length === 0 ? (
                <div className="empty-container">
                  <i className="bi bi-inbox"></i>
                  <p>No results found.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
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
                            <strong className={`score-display ${result.completed ? (result.total_score >= 50 ? 'score-pass' : 'score-fail') : 'score-pending'}`}>
                              {result.completed ? `${result.total_score}` : '-'}
                            </strong>
                          </td>
                          <td>
                            <span className={`status-badge ${result.completed ? 'status-completed' : 'status-pending'}`}>
                              <i className={`bi ${result.completed ? 'bi-check-circle' : 'bi-clock'} me-1`}></i>
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
          </div>
        </div>
      )}

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <div>
          <div className="card">
            <div className="card-header">
              <h3 className="mb-0">
                <i className="bi bi-graph-up-arrow me-2"></i>System Statistics
              </h3>
            </div>
            <div className="card-body">
              {statsLoading ? (
                <div className="loading-container">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : stats ? (
                <div className="stats-grid">
                  {/* Users Stats */}
                  <div className="stat-card">
                    <div className="stat-card-header">
                      <i className="bi bi-people-fill text-primary"></i>
                      <h4 className="text-primary">Users</h4>
                    </div>
                    <div className="stat-card-value text-primary">{stats.users.total}</div>
                    <div className="stat-card-details">
                      {Object.entries(stats.users.byRole).map(([role, count]) => (
                        <div key={role} className="stat-card-detail-row">
                          <span>{role}:</span>
                          <strong>{count}</strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Exams Stats */}
                  <div className="stat-card">
                    <div className="stat-card-header">
                      <i className="bi bi-file-earmark-text-fill text-success"></i>
                      <h4 className="text-success">Examinations</h4>
                    </div>
                    <div className="stat-card-value text-success">{stats.exams.total}</div>
                    <div className="stat-card-details">
                      <div className="stat-card-detail-row">
                        <span>Active:</span>
                        <strong className="text-success">{stats.exams.active}</strong>
                      </div>
                      <div className="stat-card-detail-row">
                        <span>Inactive:</span>
                        <strong className="text-danger">{stats.exams.inactive}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Questions Stats */}
                  <div className="stat-card">
                    <div className="stat-card-header">
                      <i className="bi bi-question-circle-fill text-warning"></i>
                      <h4 className="text-warning">Questions</h4>
                    </div>
                    <div className="stat-card-value text-warning">{stats.questions.total}</div>
                    <p className="text-muted mb-0 mt-3">Total questions in system</p>
                  </div>

                  {/* Attempts Stats */}
                  <div className="stat-card">
                    <div className="stat-card-header">
                      <i className="bi bi-clipboard-check-fill text-info"></i>
                      <h4 className="text-info">Exam Attempts</h4>
                    </div>
                    <div className="stat-card-value text-info">{stats.attempts.total}</div>
                    <div className="stat-card-details">
                      <div className="stat-card-detail-row">
                        <span>Completed:</span>
                        <strong className="text-success">{stats.attempts.completed}</strong>
                      </div>
                      <div className="stat-card-detail-row">
                        <span>Pending:</span>
                        <strong className="text-warning">{stats.attempts.pending}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Performance Stats */}
                  <div className="stat-card">
                    <div className="stat-card-header">
                      <i className="bi bi-trophy-fill text-purple"></i>
                      <h4 className="text-purple">Performance</h4>
                    </div>
                    <div className="stat-card-details">
                      <div className="stat-card-detail-row">
                        <span>Average Score:</span>
                        <strong style={{ fontSize: '1.2rem' }}>{stats.performance.averageScore.toFixed(1)}</strong>
                      </div>
                      <div className="stat-card-detail-row">
                        <span>Highest Score:</span>
                        <strong className="text-success" style={{ fontSize: '1.2rem' }}>{stats.performance.maxScore}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="empty-container">
                  <i className="bi bi-exclamation-triangle"></i>
                  <p>Unable to load statistics.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
