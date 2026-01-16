import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

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

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    try {
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

  const tabStyle = (isActive) => ({
    padding: '0.75rem 1.5rem',
    border: 'none',
    background: isActive ? '#007bff' : '#f0f0f0',
    color: isActive ? 'white' : 'black',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: isActive ? 'bold' : 'normal',
    borderBottom: isActive ? '3px solid #0056b3' : '3px solid transparent',
  });

  return (
    <div style={{ padding: '1rem', maxWidth: '1400px', margin: '0 auto' }}>
      <h2>System Admin Dashboard</h2>
      <p>Complete control over the Online Exam Portal</p>

      {error && <p style={{ color: 'red', padding: '0.5rem', background: '#ffebee', borderRadius: '4px' }}>{error}</p>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '2px solid #ddd' }}>
        <button style={tabStyle(activeTab === 'users')} onClick={() => setActiveTab('users')}>
          User Management
        </button>
        <button style={tabStyle(activeTab === 'exams')} onClick={() => setActiveTab('exams')}>
          All Examinations
        </button>
        <button style={tabStyle(activeTab === 'results')} onClick={() => setActiveTab('results')}>
          All Results
        </button>
        <button style={tabStyle(activeTab === 'stats')} onClick={() => setActiveTab('stats')}>
          System Statistics
        </button>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div>
          <section style={{ marginBottom: '2rem' }}>
            <h3>Create User</h3>
            <form
              onSubmit={handleCreateUser}
              style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', maxWidth: 800, marginBottom: '1rem' }}
            >
              <input
                name="username"
                placeholder="Username"
                value={userForm.username}
                onChange={handleUserFormChange}
                required
                style={{ padding: '0.5rem', flex: '1 1 150px' }}
              />
              <input
                name="full_name"
                placeholder="Full name"
                value={userForm.full_name}
                onChange={handleUserFormChange}
                required
                style={{ padding: '0.5rem', flex: '1 1 150px' }}
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={userForm.email}
                onChange={handleUserFormChange}
                required
                style={{ padding: '0.5rem', flex: '1 1 200px' }}
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={userForm.password}
                onChange={handleUserFormChange}
                required
                style={{ padding: '0.5rem', flex: '1 1 150px' }}
              />
              <select
                name="role"
                value={userForm.role}
                onChange={handleUserFormChange}
                style={{ padding: '0.5rem', flex: '1 1 180px' }}
              >
                <option value="Student">Student</option>
                <option value="System Admin">System Admin</option>
                <option value="Exam Manager">Exam Manager</option>
                <option value="Question Manager">Question Manager</option>
                <option value="Result Manager">Result Manager</option>
              </select>
              <button type="submit" style={{ padding: '0.5rem 1.5rem', cursor: 'pointer' }}>
                Create User
              </button>
            </form>
          </section>

          <section>
            <h3>Existing Users ({users.length})</h3>
            {usersLoading ? (
              <p>Loading users...</p>
            ) : users.length === 0 ? (
              <p>No users found.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.9rem' }}>
                  <thead style={{ background: '#f5f5f5' }}>
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
                        <td>{u.username}</td>
                        <td>{u.full_name}</td>
                        <td>{u.email}</td>
                        <td>{u.role}</td>
                        <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td>
                          <button onClick={() => handleDeleteUser(u._id)} style={{ padding: '0.25rem 0.75rem', cursor: 'pointer', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {/* Exams Tab */}
      {activeTab === 'exams' && (
        <div>
          <h3>All Examinations ({exams.length})</h3>
          {examsLoading ? (
            <p>Loading exams...</p>
          ) : exams.length === 0 ? (
            <p>No exams found.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.9rem' }}>
                <thead style={{ background: '#f5f5f5' }}>
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
                      <td>{exam.exam_name}</td>
                      <td>
                        {exam.created_by?.full_name || exam.created_by?.username || 'N/A'}
                        <br />
                        <small style={{ color: '#666' }}>{exam.created_by?.email}</small>
                      </td>
                      <td>{new Date(exam.start_time).toLocaleString()}</td>
                      <td>{new Date(exam.end_time).toLocaleString()}</td>
                      <td>{exam.duration}</td>
                      <td>
                        <span style={{ color: exam.is_active ? 'green' : 'red', fontWeight: 'bold' }}>
                          {exam.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>{new Date(exam.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Results Tab */}
      {activeTab === 'results' && (
        <div>
          <h3>All Exam Results ({results.length})</h3>
          {resultsLoading ? (
            <p>Loading results...</p>
          ) : results.length === 0 ? (
            <p>No results found.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.9rem' }}>
                <thead style={{ background: '#f5f5f5' }}>
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
                      <td>{new Date(result.start_time).toLocaleString()}</td>
                      <td>{result.end_time ? new Date(result.end_time).toLocaleString() : 'N/A'}</td>
                      <td>
                        <strong style={{ color: result.completed ? (result.total_score >= 50 ? 'green' : 'red') : '#666' }}>
                          {result.completed ? `${result.total_score}` : '-'}
                        </strong>
                      </td>
                      <td>
                        <span style={{ color: result.completed ? 'green' : 'orange', fontWeight: 'bold' }}>
                          {result.completed ? 'Completed' : 'In Progress'}
                        </span>
                      </td>
                      <td>{new Date(result.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <div>
          <h3>System Statistics</h3>
          {statsLoading ? (
            <p>Loading statistics...</p>
          ) : stats ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
              {/* Users Stats */}
              <div style={{ border: '1px solid #ddd', padding: '1.5rem', borderRadius: '8px', background: '#f9f9f9' }}>
                <h4 style={{ marginTop: 0, color: '#007bff' }}>Users</h4>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0' }}>{stats.users.total}</p>
                <div style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
                  {Object.entries(stats.users.byRole).map(([role, count]) => (
                    <div key={role} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0' }}>
                      <span>{role}:</span>
                      <strong>{count}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Exams Stats */}
              <div style={{ border: '1px solid #ddd', padding: '1.5rem', borderRadius: '8px', background: '#f9f9f9' }}>
                <h4 style={{ marginTop: 0, color: '#28a745' }}>Examinations</h4>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0' }}>{stats.exams.total}</p>
                <div style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0' }}>
                    <span>Active:</span>
                    <strong style={{ color: 'green' }}>{stats.exams.active}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0' }}>
                    <span>Inactive:</span>
                    <strong style={{ color: 'red' }}>{stats.exams.inactive}</strong>
                  </div>
                </div>
              </div>

              {/* Questions Stats */}
              <div style={{ border: '1px solid #ddd', padding: '1.5rem', borderRadius: '8px', background: '#f9f9f9' }}>
                <h4 style={{ marginTop: 0, color: '#ffc107' }}>Questions</h4>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0' }}>{stats.questions.total}</p>
                <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '1rem' }}>Total questions in system</p>
              </div>

              {/* Attempts Stats */}
              <div style={{ border: '1px solid #ddd', padding: '1.5rem', borderRadius: '8px', background: '#f9f9f9' }}>
                <h4 style={{ marginTop: 0, color: '#17a2b8' }}>Exam Attempts</h4>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0' }}>{stats.attempts.total}</p>
                <div style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0' }}>
                    <span>Completed:</span>
                    <strong style={{ color: 'green' }}>{stats.attempts.completed}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0' }}>
                    <span>Pending:</span>
                    <strong style={{ color: 'orange' }}>{stats.attempts.pending}</strong>
                  </div>
                </div>
              </div>

              {/* Performance Stats */}
              <div style={{ border: '1px solid #ddd', padding: '1.5rem', borderRadius: '8px', background: '#f9f9f9' }}>
                <h4 style={{ marginTop: 0, color: '#6f42c1' }}>Performance</h4>
                <div style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #ddd' }}>
                    <span>Average Score:</span>
                    <strong style={{ fontSize: '1.2rem' }}>{stats.performance.averageScore.toFixed(1)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', marginTop: '0.5rem' }}>
                    <span>Highest Score:</span>
                    <strong style={{ fontSize: '1.2rem', color: 'green' }}>{stats.performance.maxScore}</strong>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p>Unable to load statistics.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
