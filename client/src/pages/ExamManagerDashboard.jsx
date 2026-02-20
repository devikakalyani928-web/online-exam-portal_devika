import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/ExamManagerDashboard.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const NAV_ITEMS = [
  { key: 'overview', icon: 'bi-list-ul',              label: 'Exam Overview' },
  { key: 'create',   icon: 'bi-plus-circle-fill',     label: 'Create Exam' },
  { key: 'monitor',  icon: 'bi-eye-fill',             label: 'Monitor Exams' },
];

const ExamManagerDashboard = () => {
  const { token, user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
    durationUnit: 'minutes',
  });
  const [editForm, setEditForm] = useState({
    exam_name: '',
    start_time: '',
    end_time: '',
    duration: 60,
    durationUnit: 'minutes',
  });
  const [formErrors, setFormErrors] = useState({});
  const [editFormErrors, setEditFormErrors] = useState({});

  /* ───── Helpers ───── */

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const rem = minutes % 60;
    if (rem === 0) return `${hours} hr${hours > 1 ? 's' : ''}`;
    return `${hours} hr${hours > 1 ? 's' : ''} ${rem} min`;
  };

  const convertToMinutes = (value, unit) => (unit === 'hours' ? value * 60 : value);

  const convertFromMinutes = (minutes) =>
    minutes >= 60
      ? { value: Math.floor(minutes / 60), unit: 'hours' }
      : { value: minutes, unit: 'minutes' };

  /* ───── Data fetchers ───── */

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
    if (token) fetchExams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (selectedExam && activeTab === 'monitor') fetchExamDetails(selectedExam);
  }, [selectedExam, activeTab, token]);

  /* ───── Validation ───── */

  const validateExamForm = (formData, isEdit = false) => {
    const errors = {};
    
    // Exam name validation: only letters (no numbers, no special characters)
    if (!formData.exam_name || formData.exam_name.trim() === '') {
      errors.exam_name = 'Exam name is required.';
    } else {
      const examNameRegex = /^[a-zA-Z\s]+$/;
      if (!examNameRegex.test(formData.exam_name.trim())) {
        errors.exam_name = 'Exam name must contain only letters (no numbers or special characters).';
      }
    }
    
    // Start time validation: not allow past dates (but allow today with any time)
    if (!formData.start_time) {
      errors.start_time = 'Start time is required.';
    } else if (!isEdit) {
      const startDate = new Date(formData.start_time);
      const now = new Date();
      // Compare only the date portion (year, month, day)
      const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      if (startDateOnly < todayOnly) {
        errors.start_time = 'Start date cannot be before today.';
      }
    }
    
    // End time validation: must be greater than start time
    if (!formData.end_time) {
      errors.end_time = 'End time is required.';
    } else if (formData.start_time) {
      const startTime = new Date(formData.start_time);
      const endTime = new Date(formData.end_time);
      if (endTime <= startTime) {
        errors.end_time = 'End time must be greater than start time.';
      }
    }
    
    // Duration validation
    const durationInMinutes = convertToMinutes(formData.duration, formData.durationUnit || 'minutes');
    if (!formData.duration || formData.duration < 1) {
      errors.duration = formData.durationUnit === 'hours'
        ? 'Duration must be at least 1 hour.'
        : 'Duration must be at least 1 minute.';
    } else if (durationInMinutes > 1440) {
      errors.duration = 'Duration cannot exceed 24 hours (1440 minutes).';
    }
    
    return errors;
  };

  /* ───── Form handlers ───── */

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updatedForm = { ...form };
    if (name === 'duration') {
      updatedForm.duration = Number(value);
    } else if (name === 'durationUnit') {
      updatedForm.durationUnit = value;
      updatedForm.duration = value === 'hours'
        ? (Math.floor(updatedForm.duration / 60) || 1)
        : (updatedForm.duration * 60 || 60);
    } else {
      updatedForm[name] = value;
    }
    setForm(updatedForm);
    if (formErrors[name]) setFormErrors({ ...formErrors, [name]: '' });
    const errors = validateExamForm(updatedForm, false);
    if (errors[name]) {
      setFormErrors({ ...formErrors, [name]: errors[name] });
    } else {
      const copy = { ...formErrors };
      delete copy[name];
      setFormErrors(copy);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    let updatedForm = { ...editForm };
    if (name === 'duration') {
      updatedForm.duration = Number(value);
    } else if (name === 'durationUnit') {
      updatedForm.durationUnit = value;
      updatedForm.duration = value === 'hours'
        ? (Math.floor(updatedForm.duration / 60) || 1)
        : (updatedForm.duration * 60 || 60);
    } else {
      updatedForm[name] = value;
    }
    setEditForm(updatedForm);
    if (editFormErrors[name]) setEditFormErrors({ ...editFormErrors, [name]: '' });
    const errors = validateExamForm(updatedForm, true);
    if (errors[name]) {
      setEditFormErrors({ ...editFormErrors, [name]: errors[name] });
    } else {
      const copy = { ...editFormErrors };
      delete copy[name];
      setEditFormErrors(copy);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    const validationErrors = validateExamForm(form, false);
    if (Object.keys(validationErrors).length > 0) { setFormErrors(validationErrors); return; }
    try {
      const durationInMinutes = convertToMinutes(form.duration, form.durationUnit);
      const res = await fetch(`${API_BASE}/api/exams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          exam_name: form.exam_name,
          start_time: form.start_time,
          end_time: form.end_time,
          duration: durationInMinutes,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || body?.errors?.[0]?.msg || 'Failed to create exam');
      }
      setForm({ exam_name: '', start_time: '', end_time: '', duration: 60, durationUnit: 'minutes' });
      setFormErrors({});
      fetchExams();
      setActiveTab('overview');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (exam) => {
    setSelectedExam(exam._id);
    const d = convertFromMinutes(exam.duration);
    setEditForm({
      exam_name: exam.exam_name,
      start_time: new Date(exam.start_time).toISOString().slice(0, 16),
      end_time: new Date(exam.end_time).toISOString().slice(0, 16),
      duration: d.value,
      durationUnit: d.unit,
    });
    setEditFormErrors({});
    setEditMode(true);
    setActiveTab('create');
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    const validationErrors = validateExamForm(editForm, true);
    if (Object.keys(validationErrors).length > 0) { setEditFormErrors(validationErrors); return; }
    try {
      const durationInMinutes = convertToMinutes(editForm.duration, editForm.durationUnit);
      const res = await fetch(`${API_BASE}/api/exams/${selectedExam}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          exam_name: editForm.exam_name,
          start_time: editForm.start_time,
          end_time: editForm.end_time,
          duration: durationInMinutes,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || body?.errors?.[0]?.msg || 'Failed to update exam');
      }
      setEditMode(false);
      setSelectedExam(null);
      setEditForm({ exam_name: '', start_time: '', end_time: '', duration: 60, durationUnit: 'minutes' });
      setEditFormErrors({});
      fetchExams();
      setActiveTab('overview');
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
      if (selectedExam === id && activeTab === 'monitor') fetchExamDetails(id);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (exam) => {
    if (!window.confirm('Are you sure you want to delete this exam?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/exams/${exam._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || 'Failed to delete exam');
      }
      await res.json();
      setError('');
      if (selectedExam === exam._id) {
        setSelectedExam(null);
        setActiveTab('overview');
        setExamDetails(null);
        setAllAttempts([]);
        setOngoingAttempts([]);
      }
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

  /* ═══════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════ */

  return (
    <div className="em-dashboard">
      {/* ── Background blobs ── */}
      <div className="em-bg-effects">
        <div className="em-blob em-blob-1" />
        <div className="em-blob em-blob-2" />
        <div className="em-blob em-blob-3" />
      </div>

      {/* ── Sidebar ── */}
      <aside className={`em-sidebar ${!sidebarOpen ? 'collapsed' : ''}`}>
        <div className="em-sidebar-header">
          <div className="em-sidebar-logo">
            <i className="bi bi-file-earmark-text-fill" />
            <span className="em-sidebar-logo-text">Exam Manager</span>
          </div>
          {sidebarOpen && (
            <button className="em-sidebar-toggle" onClick={() => setSidebarOpen(false)}>
              <i className="bi bi-chevron-left" />
            </button>
          )}
        </div>

        <nav className="em-sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              className={`em-sidebar-nav-item ${activeTab === item.key ? 'active' : ''}`}
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

        <div className="em-sidebar-footer">
          <button
            className="em-sidebar-nav-item em-sidebar-logout-btn"
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
        className={`em-sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ── Main area ── */}
      <div className={`em-main ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
        {/* Top bar */}
        <header className="em-topbar">
          {!sidebarOpen && (
            <button className="em-expand-btn" onClick={() => setSidebarOpen(true)}>
              <i className="bi bi-chevron-right" />
            </button>
          )}
          <button className="em-mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
            <i className="bi bi-list" />
          </button>
          <div className="em-topbar-title">
            <h1>{NAV_ITEMS.find((n) => n.key === activeTab)?.label}</h1>
          </div>
          <div className="em-topbar-actions">
            <div className="em-topbar-user-chip">
              <div className="em-topbar-avatar" title={user?.full_name || 'User'}>
                {user?.full_name?.charAt(0)?.toUpperCase() || 'E'}
              </div>
              <div className="em-topbar-user-info">
                <span className="em-topbar-username">{user?.full_name || 'Exam Manager'}</span>
                <span className="em-topbar-role">{user?.role}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="em-content">
          {/* Error alert */}
          {error && (
            <div className="em-alert em-alert-danger">
              <i className="bi bi-exclamation-triangle-fill" />
              <span>{error}</span>
              <button onClick={() => setError('')}>
                <i className="bi bi-x-lg" />
              </button>
            </div>
          )}

          {/* ═══ OVERVIEW TAB ═══ */}
          {activeTab === 'overview' && (
            <div className="em-glass-card">
              <div className="em-glass-card-header">
                <h3>
                  <i className="bi bi-file-earmark-text-fill" />
                  All Exams ({exams.length})
                </h3>
              </div>
              {loading ? (
                <div className="em-loading"><div className="em-spinner" /></div>
              ) : exams.length === 0 ? (
                <div className="em-empty"><i className="bi bi-inbox" /><p>No exams found. Create your first exam!</p></div>
              ) : (
                <div className="em-table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Exam Name</th>
                        <th>Start Time</th>
                        <th>End Time</th>
                        <th>Duration</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exams.map((exam) => {
                        const status = getExamStatus(exam);
                        return (
                          <tr key={exam._id}>
                            <td><strong style={{ color: 'var(--text)' }}>{exam.exam_name}</strong></td>
                            <td>{new Date(exam.start_time).toLocaleString('en-GB')}</td>
                            <td>{new Date(exam.end_time).toLocaleString('en-GB')}</td>
                            <td>{formatDuration(exam.duration)}</td>
                            <td>
                              <span className={`em-status-badge em-status-${status.type}`}>
                                <i className={`bi ${status.type === 'active' ? 'bi-check-circle' : status.type === 'scheduled' ? 'bi-clock' : status.type === 'ended' ? 'bi-x-circle' : 'bi-pause-circle'}`} />
                                {status.text}
                              </span>
                            </td>
                            <td>
                              <div className="em-table-actions">
                                <button className="btn-em-primary btn-em-sm" onClick={() => handleEdit(exam)}>
                                  <i className="bi bi-pencil" /> Edit
                                </button>
                                <button
                                  className={`${exam.is_active ? 'btn-em-danger' : 'btn-em-success'} btn-em-sm`}
                                  onClick={() => handleToggleActive(exam._id, exam.is_active)}
                                >
                                  <i className={`bi ${exam.is_active ? 'bi-pause' : 'bi-play'}`} />
                                  {exam.is_active ? 'Deactivate' : 'Activate'}
                                </button>
                                <button
                                  className="btn-em-info btn-em-sm"
                                  onClick={() => { setSelectedExam(exam._id); setActiveTab('monitor'); }}
                                >
                                  <i className="bi bi-eye" /> Monitor
                                </button>
                                <button className="btn-em-danger btn-em-sm" onClick={() => handleDelete(exam)}>
                                  <i className="bi bi-trash" /> Delete
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

          {/* ═══ CREATE / EDIT TAB ═══ */}
          {activeTab === 'create' && (
            <div className="em-glass-card">
              <div className="em-glass-card-header">
                <h3>
                  <i className={`bi ${editMode ? 'bi-pencil-square' : 'bi-plus-circle'}`} />
                  {editMode ? 'Edit Exam' : 'Create New Exam'}
                </h3>
              </div>
              {editMode ? (
                <form onSubmit={handleUpdate}>
                  <div className="em-form-group">
                    <label className="form-label">Exam Name</label>
                    <input type="text" className={`form-control ${editFormErrors.exam_name ? 'is-invalid' : ''}`} name="exam_name" placeholder="e.g., Mathematics Final Exam" value={editForm.exam_name} onChange={handleEditChange} required />
                    {editFormErrors.exam_name && <div className="invalid-feedback d-block">{editFormErrors.exam_name}</div>}
                  </div>
                  <div className="em-form-row">
                    <div className="em-form-group">
                      <label className="form-label">Start Time</label>
                      <input type="datetime-local" className={`form-control ${editFormErrors.start_time ? 'is-invalid' : ''}`} name="start_time" value={editForm.start_time} onChange={handleEditChange} required />
                      {editFormErrors.start_time && <div className="invalid-feedback d-block">{editFormErrors.start_time}</div>}
                    </div>
                    <div className="em-form-group">
                      <label className="form-label">End Time</label>
                      <input type="datetime-local" className={`form-control ${editFormErrors.end_time ? 'is-invalid' : ''}`} name="end_time" value={editForm.end_time} onChange={handleEditChange} required />
                      {editFormErrors.end_time && <div className="invalid-feedback d-block">{editFormErrors.end_time}</div>}
                    </div>
                  </div>
                  <div className="em-form-group">
                    <label className="form-label">Duration {editForm.durationUnit === 'hours' ? '(hours)' : '(minutes)'}</label>
                    <div className="em-duration-group">
                      <input type="number" className={`form-control ${editFormErrors.duration ? 'is-invalid' : ''}`} name="duration" value={editForm.duration} onChange={handleEditChange} min={1} max={editForm.durationUnit === 'hours' ? 24 : 59} required />
                      <select className="form-select" name="durationUnit" value={editForm.durationUnit} onChange={handleEditChange}>
                        <option value="minutes">Minutes</option>
                        <option value="hours">Hours</option>
                      </select>
                    </div>
                    <small className="em-form-hint">Time limit for each student to complete the exam</small>
                    {editFormErrors.duration && <div className="invalid-feedback d-block">{editFormErrors.duration}</div>}
                  </div>
                  <div className="em-form-actions">
                    <button type="submit" className="btn-em-success"><i className="bi bi-check-circle" /> Update Exam</button>
                    <button type="button" className="btn-em-secondary" onClick={() => { setEditMode(false); setSelectedExam(null); setEditForm({ exam_name: '', start_time: '', end_time: '', duration: 60, durationUnit: 'minutes' }); setEditFormErrors({}); }}>
                      <i className="bi bi-x-circle" /> Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleCreate}>
                  <div className="em-form-group">
                    <label className="form-label">Exam Name</label>
                    <input type="text" className={`form-control ${formErrors.exam_name ? 'is-invalid' : ''}`} name="exam_name" placeholder="e.g., Mathematics Final Exam" value={form.exam_name} onChange={handleChange} required />
                    {formErrors.exam_name && <div className="invalid-feedback d-block">{formErrors.exam_name}</div>}
                  </div>
                  <div className="em-form-row">
                    <div className="em-form-group">
                      <label className="form-label">Start Time</label>
                      <input type="datetime-local" className={`form-control ${formErrors.start_time ? 'is-invalid' : ''}`} name="start_time" value={form.start_time} onChange={handleChange} required />
                      {formErrors.start_time && <div className="invalid-feedback d-block">{formErrors.start_time}</div>}
                    </div>
                    <div className="em-form-group">
                      <label className="form-label">End Time</label>
                      <input type="datetime-local" className={`form-control ${formErrors.end_time ? 'is-invalid' : ''}`} name="end_time" value={form.end_time} onChange={handleChange} required />
                      {formErrors.end_time && <div className="invalid-feedback d-block">{formErrors.end_time}</div>}
                    </div>
                  </div>
                  <div className="em-form-group">
                    <label className="form-label">Duration {form.durationUnit === 'hours' ? '(hours)' : '(minutes)'}</label>
                    <div className="em-duration-group">
                      <input type="number" className={`form-control ${formErrors.duration ? 'is-invalid' : ''}`} name="duration" value={form.duration} onChange={handleChange} min={1} max={form.durationUnit === 'hours' ? 24 : 59} required />
                      <select className="form-select" name="durationUnit" value={form.durationUnit} onChange={handleChange}>
                        <option value="minutes">Minutes</option>
                        <option value="hours">Hours</option>
                      </select>
                    </div>
                    <small className="em-form-hint">Time limit for each student to complete the exam</small>
                    {formErrors.duration && <div className="invalid-feedback d-block">{formErrors.duration}</div>}
                  </div>
                  <div className="em-form-actions">
                    <button type="submit" className="btn-em-success"><i className="bi bi-plus-circle" /> Create Exam</button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ═══ MONITOR TAB ═══ */}
          {activeTab === 'monitor' && (
            <div>
              {!selectedExam ? (
                <div className="em-glass-card">
                  <div className="em-glass-card-header">
                    <h3><i className="bi bi-eye-fill" /> Select an Exam to Monitor</h3>
                  </div>
                  {exams.length === 0 ? (
                    <div className="em-empty"><i className="bi bi-inbox" /><p>No exams available.</p></div>
                  ) : (
                    <div className="em-exam-selector-grid">
                      {exams.map((exam) => {
                        const status = getExamStatus(exam);
                        return (
                          <div key={exam._id} className="em-exam-selector-card" onClick={() => setSelectedExam(exam._id)}>
                            <h5>{exam.exam_name}</h5>
                            <small>{new Date(exam.start_time).toLocaleString('en-GB')} – {new Date(exam.end_time).toLocaleString('en-GB')}</small>
                            <span className={`em-status-badge em-status-${status.type}`} style={{ marginTop: '0.5rem' }}>
                              <i className={`bi ${status.type === 'active' ? 'bi-check-circle' : status.type === 'scheduled' ? 'bi-clock' : status.type === 'ended' ? 'bi-x-circle' : 'bi-pause-circle'}`} />
                              {status.text}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  {/* Monitor header */}
                  <div className="em-glass-card" style={{ marginBottom: '1.25rem' }}>
                    <div className="em-monitor-header">
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
                          <i className="bi bi-file-earmark-text" style={{ color: 'var(--accent-1)', marginRight: '0.5rem' }} />
                          {examDetails?.exam?.exam_name || 'Loading...'}
                        </h3>
                        <button className="btn-em-secondary btn-em-sm" style={{ marginTop: '0.5rem' }} onClick={() => setSelectedExam(null)}>
                          <i className="bi bi-arrow-left" /> Back to Exam List
                        </button>
                      </div>
                      <button className="btn-em-primary btn-em-sm" onClick={() => handleEdit(exams.find((e) => e._id === selectedExam))}>
                        <i className="bi bi-pencil" /> Edit Exam
                      </button>
                    </div>
                  </div>

                  {detailsLoading ? (
                    <div className="em-loading"><div className="em-spinner" /></div>
                  ) : examDetails ? (() => {
                    const validAllAttempts = allAttempts.filter((a) => a.student_id);
                    const validOngoingAttempts = ongoingAttempts.filter((a) => a.student_id);
                    const completedAttempts = validAllAttempts.filter((a) => a.completed).length;
                    const completedWithScores = validAllAttempts.filter((a) => a.completed && a.total_score !== undefined);
                    const averageScore = completedWithScores.length > 0
                      ? (completedWithScores.reduce((sum, a) => sum + a.total_score, 0) / completedWithScores.length).toFixed(2)
                      : '0.00';

                    return (
                      <div>
                        {/* Stats */}
                        <div className="em-stats-grid">
                          <div className="em-stat-card"><div className="em-stat-icon primary"><i className="bi bi-question-circle-fill" /></div><div className="em-stat-info"><span className="em-stat-label">Questions</span><span className="em-stat-value">{examDetails.questionsCount}</span></div></div>
                          <div className="em-stat-card"><div className="em-stat-icon info"><i className="bi bi-people-fill" /></div><div className="em-stat-info"><span className="em-stat-label">Total Attempts</span><span className="em-stat-value">{validAllAttempts.length}</span></div></div>
                          <div className="em-stat-card"><div className="em-stat-icon success"><i className="bi bi-check-circle-fill" /></div><div className="em-stat-info"><span className="em-stat-label">Completed</span><span className="em-stat-value">{completedAttempts}</span></div></div>
                          <div className="em-stat-card"><div className="em-stat-icon warning"><i className="bi bi-clock-fill" /></div><div className="em-stat-info"><span className="em-stat-label">Ongoing</span><span className="em-stat-value">{validOngoingAttempts.length}</span></div></div>
                          <div className="em-stat-card"><div className="em-stat-icon purple"><i className="bi bi-trophy-fill" /></div><div className="em-stat-info"><span className="em-stat-label">Avg Score</span><span className="em-stat-value">{averageScore}</span></div></div>
                        </div>

                        {/* Ongoing Attempts */}
                        <div className="em-glass-card" style={{ marginBottom: '1.25rem' }}>
                          <div className="em-glass-card-header">
                            <h3><i className="bi bi-clock-history" /> Ongoing Attempts ({validOngoingAttempts.length})</h3>
                          </div>
                          {validOngoingAttempts.length === 0 ? (
                            <div className="em-empty"><i className="bi bi-inbox" /><p>No ongoing attempts</p></div>
                          ) : (
                            <div className="em-table-wrapper">
                              <table className="table">
                                <thead><tr><th>Student</th><th>Email</th><th>Started At</th><th>Duration</th></tr></thead>
                                <tbody>
                                  {validOngoingAttempts.map((attempt) => {
                                    const duration = Math.floor((new Date() - new Date(attempt.start_time)) / 60000);
                                    return (
                                      <tr key={attempt._id}>
                                        <td>{attempt.student_id?.full_name || attempt.student_id?.username || 'N/A'}</td>
                                        <td>{attempt.student_id?.email || 'N/A'}</td>
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

                        {/* All Attempts */}
                        <div className="em-glass-card">
                          <div className="em-glass-card-header">
                            <h3><i className="bi bi-list-check" /> All Attempts ({validAllAttempts.length})</h3>
                          </div>
                          {validAllAttempts.length === 0 ? (
                            <div className="em-empty"><i className="bi bi-inbox" /><p>No attempts yet</p></div>
                          ) : (
                            <div className="em-table-wrapper">
                              <table className="table">
                                <thead><tr><th>Student</th><th>Email</th><th>Start Time</th><th>End Time</th><th>Score</th><th>Status</th></tr></thead>
                                <tbody>
                                  {validAllAttempts.map((attempt) => (
                                    <tr key={attempt._id}>
                                      <td>{attempt.student_id?.full_name || attempt.student_id?.username || 'N/A'}</td>
                                      <td>{attempt.student_id?.email || 'N/A'}</td>
                                      <td>{new Date(attempt.start_time).toLocaleString('en-GB')}</td>
                                      <td>{attempt.end_time ? new Date(attempt.end_time).toLocaleString('en-GB') : '–'}</td>
                                      <td>
                                        <strong className={`em-score ${(() => {
                                          if (!attempt.completed) return 'pending';
                                          if (attempt.is_passed !== undefined) return attempt.is_passed ? 'pass' : 'fail';
                                          const pct = examDetails.questionsCount > 0 ? (attempt.total_score / examDetails.questionsCount) * 100 : 0;
                                          return pct >= 40 ? 'pass' : 'fail';
                                        })()}`}>
                                          {attempt.completed ? `${attempt.total_score} / ${examDetails.questionsCount}` : '–'}
                                        </strong>
                                      </td>
                                      <td>
                                        <span className={`em-status-badge ${attempt.completed ? 'em-status-active' : 'em-status-scheduled'}`}>
                                          <i className={`bi ${attempt.completed ? 'bi-check-circle' : 'bi-clock'}`} />
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
                    );
                  })() : (
                    <div className="em-empty"><i className="bi bi-exclamation-triangle" /><p>Failed to load exam details</p></div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamManagerDashboard;
