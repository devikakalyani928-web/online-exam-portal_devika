import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/ExamManagerDashboard.css';

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

      // Handle 404 (exam not found) gracefully
      if (detailsRes.status === 404 || attemptsRes.status === 404 || ongoingRes.status === 404) {
        setExamDetails(null);
        setAllAttempts([]);
        setOngoingAttempts([]);
        setSelectedExam(null);
        setActiveTab('overview');
        setDetailsLoading(false);
        return;
      }

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
    setActiveTab('create'); // Switch to Create tab to show edit form
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
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg = body?.message || body?.errors?.[0]?.msg || 'Failed to update exam';
        throw new Error(msg);
      }
      setEditMode(false);
      setSelectedExam(null);
      setEditForm({
        exam_name: '',
        start_time: '',
        end_time: '',
        duration: 60,
      });
      fetchExams();
      setActiveTab('overview'); // Switch back to overview after successful update
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

  const handleDelete = async (exam) => {
    if (!window.confirm('Are you sure you want to delete this exam?')) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/exams/${exam._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg = body?.message || 'Failed to delete exam';
        throw new Error(msg);
      }
      
      const data = await res.json();
      setError('');
      
      // If the deleted exam was being monitored, clear the selection and details first
      if (selectedExam === exam._id) {
        setSelectedExam(null);
        setActiveTab('overview');
        setExamDetails(null);
        setAllAttempts([]);
        setOngoingAttempts([]);
      }
      
      // Refresh the exams list
      fetchExams();
    } catch (err) {
      setError(err.message);
    }
  };

  const getExamStatus = (exam) => {
    const now = new Date();
    const start = new Date(exam.start_time);
    const end = new Date(exam.end_time);

    if (!exam.is_active) return { text: 'Inactive', type: 'inactive' };
    if (now < start) return { text: 'Scheduled', type: 'scheduled' };
    if (now >= start && now <= end) return { text: 'Active', type: 'active' };
    return { text: 'Ended', type: 'ended' };
  };

  return (
    <div className="exam-manager-dashboard">
      <div className="dashboard-header">
        <h2><i className="bi bi-file-earmark-text"></i> Exam Manager Dashboard</h2>
        <p className="text-muted">Create, schedule, activate/deactivate, and monitor exams</p>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')} aria-label="Close"></button>
        </div>
      )}

      {/* Tabs */}
      <ul className="nav nav-tabs exam-manager-tabs" role="tablist">
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
            type="button"
          >
            <i className="bi bi-list-ul me-2"></i>Exam Overview
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
            type="button"
          >
            <i className="bi bi-plus-circle me-2"></i>Create Exam
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'monitor' ? 'active' : ''}`}
            onClick={() => setActiveTab('monitor')}
            type="button"
          >
            <i className="bi bi-eye me-2"></i>Monitor Exams
          </button>
        </li>
      </ul>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div>
          <div className="card">
            <div className="card-header">
              <h3 className="mb-0">
                <i className="bi bi-file-earmark-text-fill me-2"></i>All Exams ({exams.length})
              </h3>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="loading-container">
                  <div className="spinner-border text-success" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : exams.length === 0 ? (
                <div className="empty-container">
                  <i className="bi bi-inbox"></i>
                  <p>No exams found. Create your first exam!</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
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
                            <td><strong>{exam.exam_name}</strong></td>
                            <td>{new Date(exam.start_time).toLocaleString('en-GB')}</td>
                            <td>{new Date(exam.end_time).toLocaleString('en-GB')}</td>
                            <td>{exam.duration}</td>
                            <td>
                              <span className={`exam-status-badge exam-status-${status.type}`}>
                                <i className={`bi ${status.type === 'active' ? 'bi-check-circle' : status.type === 'scheduled' ? 'bi-clock' : status.type === 'ended' ? 'bi-x-circle' : 'bi-pause-circle'} me-1`}></i>
                                {status.text}
                              </span>
                            </td>
                            <td>
                              <div className="table-actions">
                                <button
                                  className="btn btn-sm btn-primary"
                                  onClick={() => handleEdit(exam)}
                                >
                                  <i className="bi bi-pencil me-1"></i>Edit
                                </button>
                                <button
                                  className={`btn btn-sm ${exam.is_active ? 'btn-danger' : 'btn-success'}`}
                                  onClick={() => handleToggleActive(exam._id, exam.is_active)}
                                >
                                  <i className={`bi ${exam.is_active ? 'bi-pause' : 'bi-play'} me-1`}></i>
                                  {exam.is_active ? 'Deactivate' : 'Activate'}
                                </button>
                                <button
                                  className="btn btn-sm btn-info"
                                  onClick={() => {
                                    setSelectedExam(exam._id);
                                    setActiveTab('monitor');
                                  }}
                                >
                                  <i className="bi bi-eye me-1"></i>Monitor
                                </button>
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() => handleDelete(exam)}
                                >
                                  <i className="bi bi-trash me-1"></i>Delete
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
          </div>
        </div>
      )}

      {/* Create Tab */}
      {activeTab === 'create' && (
        <div>
          <div className="card exam-form-card">
            <h3>
              <i className={`bi ${editMode ? 'bi-pencil-square' : 'bi-plus-circle'} me-2`}></i>
              {editMode ? 'Edit Exam' : 'Create New Exam'}
            </h3>
            {editMode ? (
              <form onSubmit={handleUpdate}>
                <div className="mb-3">
                  <label htmlFor="edit_exam_name" className="form-label">Exam Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="edit_exam_name"
                    name="exam_name"
                    placeholder="e.g., Mathematics Final Exam"
                    value={editForm.exam_name}
                    onChange={handleEditChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="edit_start_time" className="form-label">Start Time</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    id="edit_start_time"
                    name="start_time"
                    value={editForm.start_time}
                    onChange={handleEditChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="edit_end_time" className="form-label">End Time</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    id="edit_end_time"
                    name="end_time"
                    value={editForm.end_time}
                    onChange={handleEditChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="edit_duration" className="form-label">Duration (minutes)</label>
                  <input
                    type="number"
                    className="form-control"
                    id="edit_duration"
                    name="duration"
                    value={editForm.duration}
                    onChange={handleEditChange}
                    min={1}
                    required
                  />
                  <small className="form-text text-muted">Time limit for each student to complete the exam</small>
                </div>
                <div className="d-flex gap-2">
                  <button type="submit" className="btn btn-success flex-fill">
                    <i className="bi bi-check-circle me-2"></i>Update Exam
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setEditMode(false);
                      setSelectedExam(null);
                      setEditForm({
                        exam_name: '',
                        start_time: '',
                        end_time: '',
                        duration: 60,
                      });
                    }}
                  >
                    <i className="bi bi-x-circle me-2"></i>Cancel
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleCreate}>
                <div className="mb-3">
                  <label htmlFor="exam_name" className="form-label">Exam Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="exam_name"
                    name="exam_name"
                    placeholder="e.g., Mathematics Final Exam"
                    value={form.exam_name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="start_time" className="form-label">Start Time</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    id="start_time"
                    name="start_time"
                    value={form.start_time}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="end_time" className="form-label">End Time</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    id="end_time"
                    name="end_time"
                    value={form.end_time}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="duration" className="form-label">Duration (minutes)</label>
                  <input
                    type="number"
                    className="form-control"
                    id="duration"
                    name="duration"
                    value={form.duration}
                    onChange={handleChange}
                    min={1}
                    required
                  />
                  <small className="form-text text-muted">Time limit for each student to complete the exam</small>
                </div>
                <button type="submit" className="btn btn-success">
                  <i className="bi bi-plus-circle me-2"></i>Create Exam
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Monitor Tab */}
      {activeTab === 'monitor' && (
        <div>
          {!selectedExam ? (
            <div>
              <div className="card">
                <div className="card-header">
                  <h3 className="mb-0">
                    <i className="bi bi-eye me-2"></i>Monitor Exams
                  </h3>
                </div>
                <div className="card-body">
                  <p className="text-muted">Select an exam to monitor:</p>
                  <div className="monitor-exam-selector">
                    {exams.map((exam) => (
                      <div
                        key={exam._id}
                        className={`exam-selector-card ${selectedExam === exam._id ? 'selected' : ''}`}
                        onClick={() => setSelectedExam(exam._id)}
                      >
                        <h5>{exam.exam_name}</h5>
                        <small className="text-muted">
                          {new Date(exam.start_time).toLocaleString('en-GB')} - {new Date(exam.end_time).toLocaleString('en-GB')}
                        </small>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="card">
                <div className="card-body">
                  <div className="monitor-header">
                    <div>
                      <h4>
                        <i className="bi bi-file-earmark-text me-2"></i>
                        {examDetails?.exam?.exam_name || 'Loading...'}
                      </h4>
                      <button
                        className="btn btn-sm btn-secondary mt-2"
                        onClick={() => setSelectedExam(null)}
                      >
                        <i className="bi bi-arrow-left me-1"></i>Back to Exam List
                      </button>
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleEdit(exams.find((e) => e._id === selectedExam))}
                    >
                      <i className="bi bi-pencil me-2"></i>Edit Exam
                    </button>
                  </div>

                  {detailsLoading ? (
                    <div className="loading-container">
                      <div className="spinner-border text-success" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : examDetails ? (
                    <div>
                      {/* Exam Stats */}
                      <div className="exam-stats-grid">
                        <div className="exam-stat-card">
                          <div className="exam-stat-label">Questions</div>
                          <div className="exam-stat-value primary">{examDetails.questionsCount}</div>
                        </div>
                        <div className="exam-stat-card">
                          <div className="exam-stat-label">Total Attempts</div>
                          <div className="exam-stat-value info">{examDetails.attempts.total}</div>
                        </div>
                        <div className="exam-stat-card">
                          <div className="exam-stat-label">Completed</div>
                          <div className="exam-stat-value success">{examDetails.attempts.completed}</div>
                        </div>
                        <div className="exam-stat-card">
                          <div className="exam-stat-label">Ongoing</div>
                          <div className="exam-stat-value warning">{examDetails.attempts.ongoing}</div>
                        </div>
                        <div className="exam-stat-card">
                          <div className="exam-stat-label">Average Score</div>
                          <div className="exam-stat-value purple">{examDetails.attempts.averageScore}</div>
                        </div>
                      </div>

                      {/* Ongoing Attempts */}
                      <div className="card mb-4">
                        <div className="card-header">
                          <h5 className="mb-0">
                            <i className="bi bi-clock-history me-2"></i>Ongoing Attempts ({ongoingAttempts.length})
                          </h5>
                        </div>
                        <div className="card-body">
                          {ongoingAttempts.length === 0 ? (
                            <div className="empty-container">
                              <i className="bi bi-inbox"></i>
                              <p>No ongoing attempts</p>
                            </div>
                          ) : (
                            <div className="table-responsive">
                              <table className="table table-hover">
                                <thead>
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
                                        <td>{new Date(attempt.start_time).toLocaleString('en-GB')}</td>
                                        <td>{duration} minutes</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* All Attempts */}
                      <div className="card">
                        <div className="card-header">
                          <h5 className="mb-0">
                            <i className="bi bi-list-check me-2"></i>All Attempts
                          </h5>
                        </div>
                        <div className="card-body">
                          {allAttempts.length === 0 ? (
                            <div className="empty-container">
                              <i className="bi bi-inbox"></i>
                              <p>No attempts yet</p>
                            </div>
                          ) : (
                            <div className="table-responsive">
                              <table className="table table-hover">
                                <thead>
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
                                      <td>{new Date(attempt.start_time).toLocaleString('en-GB')}</td>
                                      <td>{attempt.end_time ? new Date(attempt.end_time).toLocaleString('en-GB') : '-'}</td>
                                      <td>
                                        <strong className={`score-display ${attempt.completed ? (attempt.total_score >= examDetails.questionsCount / 2 ? 'score-pass' : 'score-fail') : 'score-pending'}`}>
                                          {attempt.completed ? `${attempt.total_score} / ${examDetails.questionsCount}` : '-'}
                                        </strong>
                                      </td>
                                      <td>
                                        <span className={`status-badge ${attempt.completed ? 'status-completed' : 'status-pending'}`}>
                                          <i className={`bi ${attempt.completed ? 'bi-check-circle' : 'bi-clock'} me-1`}></i>
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
                    </div>
                  ) : (
                    <div className="empty-container">
                      <i className="bi bi-exclamation-triangle"></i>
                      <p>Failed to load exam details</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExamManagerDashboard;
