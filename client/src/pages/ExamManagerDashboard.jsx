import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const ExamManagerDashboard = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [examDetails, setExamDetails] = useState(null);
  const [ongoingAttempts, setOngoingAttempts] = useState([]);
  const [allAttempts, setAllAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    exam_name: '',
    start_time: '',
    end_time: '',
    duration: 60,
  });
  const [editForm, setEditForm] = useState({
    exam_name: '',
    start_time: '',
    end_time: '',
    duration: 60,
  });

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/exams`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load exams');
      const data = await res.json();
      setExams(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchExamDetails = async (examId) => {
    try {
      setDetailsLoading(true);
      const [detailsRes, attemptsRes, ongoingRes] = await Promise.all([
        fetch(`${API_BASE}/api/exams/${examId}/details`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/api/exams/${examId}/attempts`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/api/exams/${examId}/ongoing`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!detailsRes.ok || !attemptsRes.ok || !ongoingRes.ok) {
        throw new Error('Failed to load exam details');
      }

      const details = await detailsRes.json();
      const attempts = await attemptsRes.json();
      const ongoing = await ongoingRes.json();

      setExamDetails(details);
      setAllAttempts(attempts);
      setOngoingAttempts(ongoing);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchExams();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (selectedExam && activeTab === 'monitor') {
      fetchExamDetails(selectedExam);
    }
  }, [selectedExam, activeTab, token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === 'duration' ? Number(value) : value }));
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: name === 'duration' ? Number(value) : value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/exams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg = body?.message || body?.errors?.[0]?.msg || 'Failed to create exam';
        throw new Error(msg);
      }
      setForm({
        exam_name: '',
        start_time: '',
        end_time: '',
        duration: 60,
      });
      fetchExams();
      setActiveTab('overview');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (exam) => {
    setSelectedExam(exam._id);
    setEditForm({
      exam_name: exam.exam_name,
      start_time: new Date(exam.start_time).toISOString().slice(0, 16),
      end_time: new Date(exam.end_time).toISOString().slice(0, 16),
      duration: exam.duration,
    });
    setEditMode(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/exams/${selectedExam}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error('Failed to update exam');
      setEditMode(false);
      setSelectedExam(null);
      fetchExams();
      if (activeTab === 'monitor') {
        fetchExamDetails(selectedExam);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleActive = async (id, isActive) => {
    try {
      const endpoint = isActive ? 'deactivate' : 'activate';
      const res = await fetch(`${API_BASE}/api/exams/${id}/${endpoint}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to update exam status');
      fetchExams();
      if (selectedExam === id && activeTab === 'monitor') {
        fetchExamDetails(id);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const getExamStatus = (exam) => {
    const now = new Date();
    const start = new Date(exam.start_time);
    const end = new Date(exam.end_time);

    if (!exam.is_active) return { text: 'Inactive', color: 'gray' };
    if (now < start) return { text: 'Scheduled', color: 'blue' };
    if (now >= start && now <= end) return { text: 'Active', color: 'green' };
    return { text: 'Ended', color: 'red' };
  };

  const tabStyle = (isActive) => ({
    padding: '0.75rem 1.5rem',
    border: 'none',
    background: isActive ? '#28a745' : '#f0f0f0',
    color: isActive ? 'white' : 'black',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: isActive ? 'bold' : 'normal',
    borderBottom: isActive ? '3px solid #1e7e34' : '3px solid transparent',
  });

  return (
    <div style={{ padding: '1rem', maxWidth: '1400px', margin: '0 auto' }}>
      <h2>Exam Manager Dashboard</h2>
      <p>Create, schedule, activate/deactivate, and monitor exams</p>

      {error && <p style={{ color: 'red', padding: '0.5rem', background: '#ffebee', borderRadius: '4px' }}>{error}</p>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '2px solid #ddd' }}>
        <button style={tabStyle(activeTab === 'overview')} onClick={() => setActiveTab('overview')}>
          Exam Overview
        </button>
        <button style={tabStyle(activeTab === 'create')} onClick={() => setActiveTab('create')}>
          Create Exam
        </button>
        <button style={tabStyle(activeTab === 'monitor')} onClick={() => setActiveTab('monitor')}>
          Monitor Exams
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div>
          <h3>All Exams ({exams.length})</h3>
          {loading ? (
            <p>Loading exams...</p>
          ) : exams.length === 0 ? (
            <p>No exams found. Create your first exam!</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.9rem' }}>
                <thead style={{ background: '#f5f5f5' }}>
                  <tr>
                    <th>Exam Name</th>
                    <th>Start Time</th>
                    <th>End Time</th>
                    <th>Duration (min)</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {exams.map((exam) => {
                    const status = getExamStatus(exam);
                    return (
                      <tr key={exam._id}>
                        <td>
                          <strong>{exam.exam_name}</strong>
                        </td>
                        <td>{new Date(exam.start_time).toLocaleString()}</td>
                        <td>{new Date(exam.end_time).toLocaleString()}</td>
                        <td>{exam.duration}</td>
                        <td>
                          <span style={{ color: status.color, fontWeight: 'bold' }}>{status.text}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => handleEdit(exam)}
                              style={{ padding: '0.25rem 0.75rem', cursor: 'pointer', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.85rem' }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleToggleActive(exam._id, exam.is_active)}
                              style={{
                                padding: '0.25rem 0.75rem',
                                cursor: 'pointer',
                                background: exam.is_active ? '#dc3545' : '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '0.85rem',
                              }}
                            >
                              {exam.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => {
                                setSelectedExam(exam._id);
                                setActiveTab('monitor');
                              }}
                              style={{ padding: '0.25rem 0.75rem', cursor: 'pointer', background: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.85rem' }}
                            >
                              Monitor
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Create Tab */}
      {activeTab === 'create' && (
        <div>
          <h3>Create New Exam</h3>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 500 }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Exam Name</label>
              <input
                name="exam_name"
                placeholder="e.g., Mathematics Final Exam"
                value={form.exam_name}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '0.5rem', fontSize: '1rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Start Time</label>
              <input
                type="datetime-local"
                name="start_time"
                value={form.start_time}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '0.5rem', fontSize: '1rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>End Time</label>
              <input
                type="datetime-local"
                name="end_time"
                value={form.end_time}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '0.5rem', fontSize: '1rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Duration (minutes)</label>
              <input
                type="number"
                name="duration"
                value={form.duration}
                onChange={handleChange}
                min={1}
                required
                style={{ width: '100%', padding: '0.5rem', fontSize: '1rem' }}
              />
              <small style={{ color: '#666' }}>Time limit for each student to complete the exam</small>
            </div>
            <button type="submit" style={{ padding: '0.75rem 1.5rem', cursor: 'pointer', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', fontSize: '1rem', fontWeight: 'bold' }}>
              Create Exam
            </button>
          </form>
        </div>
      )}

      {/* Monitor Tab */}
      {activeTab === 'monitor' && (
        <div>
          <h3>Monitor Exams</h3>
          {!selectedExam ? (
            <div>
              <p>Select an exam to monitor:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: 600 }}>
                {exams.map((exam) => (
                  <button
                    key={exam._id}
                    onClick={() => setSelectedExam(exam._id)}
                    style={{
                      padding: '1rem',
                      textAlign: 'left',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      background: selectedExam === exam._id ? '#e7f3ff' : 'white',
                    }}
                  >
                    <strong>{exam.exam_name}</strong>
                    <br />
                    <small>{new Date(exam.start_time).toLocaleString()} - {new Date(exam.end_time).toLocaleString()}</small>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              {editMode ? (
                <div>
                  <h4>Edit Exam</h4>
                  <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 500, marginBottom: '1rem' }}>
                    <input name="exam_name" value={editForm.exam_name} onChange={handleEditChange} required style={{ padding: '0.5rem' }} />
                    <input type="datetime-local" name="start_time" value={editForm.start_time} onChange={handleEditChange} required style={{ padding: '0.5rem' }} />
                    <input type="datetime-local" name="end_time" value={editForm.end_time} onChange={handleEditChange} required style={{ padding: '0.5rem' }} />
                    <input type="number" name="duration" value={editForm.duration} onChange={handleEditChange} min={1} required style={{ padding: '0.5rem' }} />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button type="submit" style={{ padding: '0.5rem 1rem', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        Save Changes
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditMode(false);
                          setSelectedExam(null);
                        }}
                        style={{ padding: '0.5rem 1rem', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                      <h4>{examDetails?.exam?.exam_name || 'Loading...'}</h4>
                      <button
                        onClick={() => setSelectedExam(null)}
                        style={{ padding: '0.25rem 0.75rem', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        ← Back to Exam List
                      </button>
                    </div>
                    <button
                      onClick={() => handleEdit(exams.find((e) => e._id === selectedExam))}
                      style={{ padding: '0.5rem 1rem', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Edit Exam
                    </button>
                  </div>

                  {detailsLoading ? (
                    <p>Loading exam details...</p>
                  ) : examDetails ? (
                    <div>
                      {/* Exam Stats */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                        <div style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '8px', background: '#f9f9f9' }}>
                          <div style={{ fontSize: '0.9rem', color: '#666' }}>Questions</div>
                          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#007bff' }}>{examDetails.questionsCount}</div>
                        </div>
                        <div style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '8px', background: '#f9f9f9' }}>
                          <div style={{ fontSize: '0.9rem', color: '#666' }}>Total Attempts</div>
                          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#17a2b8' }}>{examDetails.attempts.total}</div>
                        </div>
                        <div style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '8px', background: '#f9f9f9' }}>
                          <div style={{ fontSize: '0.9rem', color: '#666' }}>Completed</div>
                          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#28a745' }}>{examDetails.attempts.completed}</div>
                        </div>
                        <div style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '8px', background: '#f9f9f9' }}>
                          <div style={{ fontSize: '0.9rem', color: '#666' }}>Ongoing</div>
                          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ffc107' }}>{examDetails.attempts.ongoing}</div>
                        </div>
                        <div style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '8px', background: '#f9f9f9' }}>
                          <div style={{ fontSize: '0.9rem', color: '#666' }}>Average Score</div>
                          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#6f42c1' }}>{examDetails.attempts.averageScore}</div>
                        </div>
                      </div>

                      {/* Ongoing Attempts */}
                      <div style={{ marginBottom: '2rem' }}>
                        <h4>Ongoing Attempts ({ongoingAttempts.length})</h4>
                        {ongoingAttempts.length === 0 ? (
                          <p>No ongoing attempts</p>
                        ) : (
                          <div style={{ overflowX: 'auto' }}>
                            <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.9rem' }}>
                              <thead style={{ background: '#f5f5f5' }}>
                                <tr>
                                  <th>Student</th>
                                  <th>Email</th>
                                  <th>Started At</th>
                                  <th>Duration</th>
                                </tr>
                              </thead>
                              <tbody>
                                {ongoingAttempts.map((attempt) => {
                                  const duration = Math.floor((new Date() - new Date(attempt.start_time)) / 60000);
                                  return (
                                    <tr key={attempt._id}>
                                      <td>{attempt.student_id?.full_name || attempt.student_id?.username}</td>
                                      <td>{attempt.student_id?.email}</td>
                                      <td>{new Date(attempt.start_time).toLocaleString()}</td>
                                      <td>{duration} minutes</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      {/* All Attempts */}
                      <div>
                        <h4>All Attempts</h4>
                        {allAttempts.length === 0 ? (
                          <p>No attempts yet</p>
                        ) : (
                          <div style={{ overflowX: 'auto' }}>
                            <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.9rem' }}>
                              <thead style={{ background: '#f5f5f5' }}>
                                <tr>
                                  <th>Student</th>
                                  <th>Email</th>
                                  <th>Start Time</th>
                                  <th>End Time</th>
                                  <th>Score</th>
                                  <th>Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {allAttempts.map((attempt) => (
                                  <tr key={attempt._id}>
                                    <td>{attempt.student_id?.full_name || attempt.student_id?.username}</td>
                                    <td>{attempt.student_id?.email}</td>
                                    <td>{new Date(attempt.start_time).toLocaleString()}</td>
                                    <td>{attempt.end_time ? new Date(attempt.end_time).toLocaleString() : '-'}</td>
                                    <td>
                                      <strong style={{ color: attempt.completed ? (attempt.total_score >= examDetails.questionsCount / 2 ? 'green' : 'red') : '#666' }}>
                                        {attempt.completed ? `${attempt.total_score} / ${examDetails.questionsCount}` : '-'}
                                      </strong>
                                    </td>
                                    <td>
                                      <span style={{ color: attempt.completed ? 'green' : 'orange', fontWeight: 'bold' }}>
                                        {attempt.completed ? 'Completed' : 'In Progress'}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p>Failed to load exam details</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExamManagerDashboard;
