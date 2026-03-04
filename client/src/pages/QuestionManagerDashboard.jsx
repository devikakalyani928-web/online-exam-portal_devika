import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../utils/api';
import '../styles/QuestionManagerDashboard.css';

const NAV_ITEMS = [
  { key: 'manage',       icon: 'bi-file-earmark-text-fill', label: 'Manage by Exam' },
  { key: 'questionBank', icon: 'bi-journal-text',           label: 'Question Bank' },
  { key: 'stats',        icon: 'bi-graph-up',               label: 'Statistics' },
];

const QuestionManagerDashboard = () => {
  const { token, user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('manage');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [questions, setQuestions] = useState([]);
  const [allQuestions, setAllQuestions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [examsLoading, setExamsLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState({
    question_text: '',
    option1: '',
    option2: '',
    option3: '',
    option4: '',
    correct_option: 1,
  });
  const [editForm, setEditForm] = useState({
    question_text: '',
    option1: '',
    option2: '',
    option3: '',
    option4: '',
    correct_option: 1,
  });

  /* ───── Data fetchers ───── */

  const fetchExams = async () => {
    try {
      setExamsLoading(true);
      setError('');
      const res = await fetch(`${API_BASE}/api/exams`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load exams');
      const data = await res.json();
      
      // Log API response for debugging
      console.log('[QuestionManagerDashboard] fetchExams - API Response:', {
        count: data.length,
        exams: data.map(exam => ({
          id: exam._id,
          name: exam.exam_name,
          is_active: exam.is_active,
          created_by: exam.created_by?.username || exam.created_by
        }))
      });
      
      // Filter to only show active exams on frontend (additional safety check)
      const activeExams = data.filter(exam => exam.is_active === true);
      
      console.log('[QuestionManagerDashboard] fetchExams - Active Exams:', {
        count: activeExams.length,
        examNames: activeExams.map(e => e.exam_name)
      });
      
      setExams(activeExams);
    } catch (err) {
      console.error('[QuestionManagerDashboard] fetchExams - Error:', err);
      setError(err.message);
      setExams([]); // Clear exams on error
    } finally {
      setExamsLoading(false);
    }
  };

  const fetchQuestions = async (examId) => {
    if (!examId) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/questions/${examId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load questions');
      const data = await res.json();
      setQuestions(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllQuestions = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/questions/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load questions');
      const data = await res.json();
      setAllQuestions(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const res = await fetch(`${API_BASE}/api/questions/stats`, {
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

  useEffect(() => {
    if (token) fetchExams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (selectedExamId && token && activeTab === 'manage') {
      fetchQuestions(selectedExamId);
    }
  }, [selectedExamId, token, activeTab]);

  useEffect(() => {
    if (token && activeTab === 'questionBank') fetchAllQuestions();
  }, [token, activeTab]);

  useEffect(() => {
    if (token && activeTab === 'stats') fetchStats();
  }, [token, activeTab]);

  /* ───── Form handlers ───── */

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'correct_option' ? Number(value) : value,
    }));
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: name === 'correct_option' ? Number(value) : value,
    }));
  };

  const checkForDuplicate = async (questionText, examId, excludeId = null) => {
    try {
      const res = await fetch(`${API_BASE}/api/questions/check-duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          question_text: questionText,
          exam_id: examId,
          exclude_id: excludeId,
        }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      return data.isDuplicate;
    } catch (err) {
      return false;
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!selectedExamId) {
      setError('Select an exam first');
      return;
    }

    const isDuplicate = await checkForDuplicate(form.question_text, selectedExamId);
    if (isDuplicate) {
      setError('A similar question already exists in this exam. Please modify the question text.');
      return;
    }

    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...form, exam_id: selectedExamId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg = body?.message || body?.errors?.[0]?.msg || 'Failed to add question';
        throw new Error(msg);
      }
      setForm({
        question_text: '',
        option1: '',
        option2: '',
        option3: '',
        option4: '',
        correct_option: 1,
      });
      fetchQuestions(selectedExamId);
      if (activeTab === 'questionBank') fetchAllQuestions();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (question) => {
    setEditingQuestion(question._id);
    setEditForm({
      question_text: question.question_text,
      option1: question.option1,
      option2: question.option2,
      option3: question.option3,
      option4: question.option4,
      correct_option: question.correct_option,
    });
    setEditMode(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingQuestion) return;

    const question = questions.find((q) => q._id === editingQuestion);
    if (question) {
      const isDuplicate = await checkForDuplicate(editForm.question_text, question.exam_id, editingQuestion);
      if (isDuplicate) {
        setError('A similar question already exists in this exam. Please modify the question text.');
        return;
      }
    }

    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/questions/${editingQuestion}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error('Failed to update question');
      setEditMode(false);
      setEditingQuestion(null);
      fetchQuestions(selectedExamId);
      if (activeTab === 'questionBank') fetchAllQuestions();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/questions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete question');
      setQuestions((prev) => prev.filter((q) => q._id !== id));
      if (activeTab === 'questionBank') fetchAllQuestions();
    } catch (err) {
      setError(err.message);
    }
  };

  /* ───── Derived data ───── */

  const filteredQuestions = allQuestions.filter((q) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      q.question_text.toLowerCase().includes(searchLower) ||
      q.exam_id?.exam_name?.toLowerCase().includes(searchLower) ||
      q.option1.toLowerCase().includes(searchLower) ||
      q.option2.toLowerCase().includes(searchLower) ||
      q.option3.toLowerCase().includes(searchLower) ||
      q.option4.toLowerCase().includes(searchLower)
    );
  });

  const groupedQuestions = filteredQuestions.reduce((acc, question) => {
    const examName = question.exam_id?.exam_name || 'Unassigned';
    if (!acc[examName]) acc[examName] = [];
    acc[examName].push(question);
    return acc;
  }, {});

  const sortedExamNames = Object.keys(groupedQuestions).sort();

  /* ═══════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════ */

  return (
    <div className="qm-dashboard">
      {/* ── Background blobs ── */}
      <div className="qm-bg-effects">
        <div className="qm-blob qm-blob-1" />
        <div className="qm-blob qm-blob-2" />
        <div className="qm-blob qm-blob-3" />
      </div>

      {/* ── Sidebar ── */}
      <aside className={`qm-sidebar ${!sidebarOpen ? 'collapsed' : ''}`}>
        <div className="qm-sidebar-header">
          <div className="qm-sidebar-logo">
            <i className="bi bi-question-circle-fill" />
            <span className="qm-sidebar-logo-text">Question Manager</span>
          </div>
          {sidebarOpen && (
            <button className="qm-sidebar-toggle" onClick={() => setSidebarOpen(false)}>
              <i className="bi bi-chevron-left" />
            </button>
          )}
        </div>

        <nav className="qm-sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              className={`qm-sidebar-nav-item ${activeTab === item.key ? 'active' : ''}`}
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

        <div className="qm-sidebar-footer">
          <button
            className="qm-sidebar-nav-item qm-sidebar-logout-btn"
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
        className={`qm-sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ── Main area ── */}
      <div className={`qm-main ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
        {/* Top bar */}
        <header className="qm-topbar">
          {!sidebarOpen && (
            <button className="qm-expand-btn" onClick={() => setSidebarOpen(true)}>
              <i className="bi bi-chevron-right" />
            </button>
          )}
          <button className="qm-mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
            <i className="bi bi-list" />
          </button>
          <div className="qm-topbar-title">
            <h1>{NAV_ITEMS.find((n) => n.key === activeTab)?.label}</h1>
          </div>
          <div className="qm-topbar-actions">
            <div className="qm-topbar-user-chip">
              <div className="qm-topbar-avatar" title={user?.full_name || 'User'}>
                {user?.full_name?.charAt(0)?.toUpperCase() || 'Q'}
              </div>
              <div className="qm-topbar-user-info">
                <span className="qm-topbar-username">{user?.full_name || 'Question Manager'}</span>
                <span className="qm-topbar-role">{user?.role}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="qm-content">
          {/* Error alert */}
          {error && (
            <div className="qm-alert qm-alert-danger">
              <i className="bi bi-exclamation-triangle-fill" />
              <span>{error}</span>
              <button onClick={() => setError('')}>
                <i className="bi bi-x-lg" />
              </button>
            </div>
          )}

          {/* ═══ MANAGE BY EXAM TAB ═══ */}
          {activeTab === 'manage' && (
            <>
              {/* Exam selector */}
              <div className="qm-glass-card" style={{ marginBottom: '1.25rem' }}>
                <div className="qm-glass-card-header">
                  <h3><i className="bi bi-funnel" /> Select Exam</h3>
                </div>
                {examsLoading ? (
                  <div className="qm-loading"><div className="qm-spinner" /></div>
                ) : exams.length === 0 ? (
                  <div className="qm-empty">
                    <i className="bi bi-info-circle" />
                    <p>No exams available. Ask Exam Manager to create exams first.</p>
                  </div>
                ) : (
                  <select
                    className="form-select"
                    value={selectedExamId}
                    onChange={(e) => {
                      setSelectedExamId(e.target.value);
                      if (!e.target.value) {
                        setQuestions([]);
                        setEditMode(false);
                        setEditingQuestion(null);
                      }
                    }}
                    style={{ maxWidth: '400px' }}
                  >
                    <option value="">-- Select an Exam --</option>
                    {exams.map((exam) => (
                      <option key={exam._id} value={exam._id}>{exam.exam_name}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Add / Edit question form */}
              {!editMode ? (
                <div className="qm-glass-card" style={{ marginBottom: '1.25rem' }}>
                  <div className="qm-glass-card-header">
                    <h3><i className="bi bi-plus-circle" /> Add Question</h3>
                  </div>
                  <form onSubmit={handleCreate}>
                    <div className="qm-form-group">
                      <label htmlFor="question_text" className="form-label">Question Text</label>
                      <textarea
                        className="form-control"
                        id="question_text"
                        name="question_text"
                        placeholder="Enter your question here..."
                        value={form.question_text}
                        onChange={handleChange}
                        required
                        rows={3}
                      />
                    </div>
                    <div className="qm-form-row">
                      <div className="qm-form-group">
                        <label htmlFor="option1" className="form-label">Option 1</label>
                        <input type="text" className="form-control" id="option1" name="option1" value={form.option1} onChange={handleChange} required />
                      </div>
                      <div className="qm-form-group">
                        <label htmlFor="option2" className="form-label">Option 2</label>
                        <input type="text" className="form-control" id="option2" name="option2" value={form.option2} onChange={handleChange} required />
                      </div>
                    </div>
                    <div className="qm-form-row">
                      <div className="qm-form-group">
                        <label htmlFor="option3" className="form-label">Option 3</label>
                        <input type="text" className="form-control" id="option3" name="option3" value={form.option3} onChange={handleChange} required />
                      </div>
                      <div className="qm-form-group">
                        <label htmlFor="option4" className="form-label">Option 4</label>
                        <input type="text" className="form-control" id="option4" name="option4" value={form.option4} onChange={handleChange} required />
                      </div>
                    </div>
                    <div className="qm-form-group">
                      <label htmlFor="correct_option" className="form-label">Correct Option</label>
                      <select className="form-select" id="correct_option" name="correct_option" value={form.correct_option} onChange={handleChange} style={{ maxWidth: '200px' }}>
                        <option value={1}>Option 1</option>
                        <option value={2}>Option 2</option>
                        <option value={3}>Option 3</option>
                        <option value={4}>Option 4</option>
                      </select>
                    </div>
                    <div className="qm-form-actions">
                      <button type="submit" className="btn-qm-primary">
                        <i className="bi bi-plus-circle" /> Add Question
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="qm-glass-card qm-edit-mode" style={{ marginBottom: '1.25rem' }}>
                  <div className="qm-glass-card-header">
                    <h3><i className="bi bi-pencil-square" /> Edit Question</h3>
                  </div>
                  <form onSubmit={handleUpdate}>
                    <div className="qm-form-group">
                      <label htmlFor="edit_question_text" className="form-label">Question Text</label>
                      <textarea
                        className="form-control"
                        id="edit_question_text"
                        name="question_text"
                        value={editForm.question_text}
                        onChange={handleEditChange}
                        required
                        rows={3}
                      />
                    </div>
                    <div className="qm-form-row">
                      <div className="qm-form-group">
                        <label htmlFor="edit_option1" className="form-label">Option 1</label>
                        <input type="text" className="form-control" id="edit_option1" name="option1" value={editForm.option1} onChange={handleEditChange} required />
                      </div>
                      <div className="qm-form-group">
                        <label htmlFor="edit_option2" className="form-label">Option 2</label>
                        <input type="text" className="form-control" id="edit_option2" name="option2" value={editForm.option2} onChange={handleEditChange} required />
                      </div>
                    </div>
                    <div className="qm-form-row">
                      <div className="qm-form-group">
                        <label htmlFor="edit_option3" className="form-label">Option 3</label>
                        <input type="text" className="form-control" id="edit_option3" name="option3" value={editForm.option3} onChange={handleEditChange} required />
                      </div>
                      <div className="qm-form-group">
                        <label htmlFor="edit_option4" className="form-label">Option 4</label>
                        <input type="text" className="form-control" id="edit_option4" name="option4" value={editForm.option4} onChange={handleEditChange} required />
                      </div>
                    </div>
                    <div className="qm-form-group">
                      <label htmlFor="edit_correct_option" className="form-label">Correct Option</label>
                      <select className="form-select" id="edit_correct_option" name="correct_option" value={editForm.correct_option} onChange={handleEditChange} style={{ maxWidth: '200px' }}>
                        <option value={1}>Option 1</option>
                        <option value={2}>Option 2</option>
                        <option value={3}>Option 3</option>
                        <option value={4}>Option 4</option>
                      </select>
                    </div>
                    <div className="qm-form-actions">
                      <button type="submit" className="btn-qm-success">
                        <i className="bi bi-check-circle" /> Save Changes
                      </button>
                      <button
                        type="button"
                        className="btn-qm-secondary"
                        onClick={() => { setEditMode(false); setEditingQuestion(null); }}
                      >
                        <i className="bi bi-x-circle" /> Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Questions table */}
              {selectedExamId && (
                <div className="qm-glass-card">
                  <div className="qm-glass-card-header">
                    <h3><i className="bi bi-list-ul" /> Questions for Selected Exam ({questions.length})</h3>
                  </div>
                  {loading ? (
                    <div className="qm-loading"><div className="qm-spinner" /></div>
                  ) : questions.length === 0 ? (
                    <div className="qm-empty">
                      <i className="bi bi-inbox" />
                      <p>No questions yet. Add your first question above.</p>
                    </div>
                  ) : (
                    <div className="qm-table-wrapper">
                      <table className="table">
                        <thead>
                          <tr>
                            <th style={{ width: '40%' }}>Question</th>
                            <th style={{ width: '35%' }}>Options</th>
                            <th style={{ width: '10%' }}>Correct</th>
                            <th style={{ width: '15%' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {questions.map((q) => (
                            <tr key={q._id} className={editingQuestion === q._id ? 'qm-row-editing' : ''}>
                              <td>{q.question_text}</td>
                              <td>
                                <div className="qm-option-list">
                                  <div className="qm-option-item">1. {q.option1}</div>
                                  <div className="qm-option-item">2. {q.option2}</div>
                                  <div className="qm-option-item">3. {q.option3}</div>
                                  <div className="qm-option-item">4. {q.option4}</div>
                                </div>
                              </td>
                              <td>
                                <span className="qm-correct-badge">{q.correct_option}</span>
                              </td>
                              <td>
                                <div className="qm-table-actions">
                                  <button className="btn-qm-primary btn-qm-sm" onClick={() => handleEdit(q)}>
                                    <i className="bi bi-pencil" /> Edit
                                  </button>
                                  <button className="btn-qm-danger btn-qm-sm" onClick={() => handleDelete(q._id)}>
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
              )}
            </>
          )}

          {/* ═══ QUESTION BANK TAB ═══ */}
          {activeTab === 'questionBank' && (
            <>
              {/* Search bar */}
              <div className="qm-glass-card" style={{ marginBottom: '1.25rem' }}>
                <div className="qm-bank-header">
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <i className="bi bi-journal-text" style={{ color: 'var(--accent-1)' }} />
                    All Questions ({filteredQuestions.length})
                  </h3>
                  <div className="qm-bank-search">
                    <i className="bi bi-search qm-search-icon" />
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search questions, options, or exam name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="qm-loading"><div className="qm-spinner" /></div>
              ) : filteredQuestions.length === 0 ? (
                <div className="qm-glass-card">
                  <div className="qm-empty">
                    <i className="bi bi-inbox" />
                    <p>No questions found{searchTerm && ` matching "${searchTerm}"`}.</p>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {sortedExamNames.map((examName) => {
                    const qs = groupedQuestions[examName];
                    return (
                      <div key={examName} className="qm-question-group">
                        <div className="qm-group-header">
                          <span>{examName}</span>
                          <span className="qm-group-count">
                            {qs.length} question{qs.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="qm-table-wrapper">
                          <table className="table">
                            <thead>
                              <tr>
                                <th style={{ width: '40%' }}>Question</th>
                                <th style={{ width: '30%' }}>Options</th>
                                <th style={{ width: '8%' }}>Correct</th>
                                <th style={{ width: '12%' }}>Created</th>
                                <th style={{ width: '10%' }}>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {qs.map((q) => (
                                <tr key={q._id} className={editingQuestion === q._id ? 'qm-row-editing' : ''}>
                                  <td>{q.question_text}</td>
                                  <td>
                                    <div className="qm-option-list">
                                      <div className="qm-option-item">1. {q.option1}</div>
                                      <div className="qm-option-item">2. {q.option2}</div>
                                      <div className="qm-option-item">3. {q.option3}</div>
                                      <div className="qm-option-item">4. {q.option4}</div>
                                    </div>
                                  </td>
                                  <td>
                                    <span className="qm-correct-badge">{q.correct_option}</span>
                                  </td>
                                  <td>{new Date(q.createdAt).toLocaleDateString('en-GB')}</td>
                                  <td>
                                    <div className="qm-table-actions">
                                      <button
                                        className="btn-qm-primary btn-qm-sm"
                                        onClick={() => {
                                          setEditingQuestion(q._id);
                                          setEditForm({
                                            question_text: q.question_text,
                                            option1: q.option1,
                                            option2: q.option2,
                                            option3: q.option3,
                                            option4: q.option4,
                                            correct_option: q.correct_option,
                                          });
                                          setSelectedExamId(q.exam_id?._id || '');
                                          setActiveTab('manage');
                                          setEditMode(true);
                                        }}
                                      >
                                        <i className="bi bi-pencil" /> Edit
                                      </button>
                                      <button className="btn-qm-danger btn-qm-sm" onClick={() => handleDelete(q._id)}>
                                        <i className="bi bi-trash" /> Delete
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ═══ STATISTICS TAB ═══ */}
          {activeTab === 'stats' && (
            <div className="qm-glass-card">
              <div className="qm-glass-card-header">
                <h3><i className="bi bi-graph-up-arrow" /> Question Bank Statistics</h3>
              </div>
              {statsLoading ? (
                <div className="qm-loading"><div className="qm-spinner" /></div>
              ) : stats ? (
                <>
                  {/* Stat cards */}
                  <div className="qm-stats-grid">
                    <div className="qm-stat-card">
                      <div className="qm-stat-icon primary">
                        <i className="bi bi-question-circle-fill" />
                      </div>
                      <div className="qm-stat-info">
                        <span className="qm-stat-label">Total Questions</span>
                        <span className="qm-stat-value">{stats.totalQuestions}</span>
                      </div>
                    </div>
                    <div className="qm-stat-card">
                      <div className="qm-stat-icon info">
                        <i className="bi bi-file-earmark-text-fill" />
                      </div>
                      <div className="qm-stat-info">
                        <span className="qm-stat-label">Exams with Questions</span>
                        <span className="qm-stat-value">{stats.questionsByExam?.length || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Questions by Exam table */}
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <i className="bi bi-list-ul" style={{ color: 'var(--accent-1)' }} />
                    Questions by Exam
                  </h4>
                  {stats.questionsByExam.length === 0 ? (
                    <div className="qm-empty">
                      <i className="bi bi-info-circle" />
                      <p>No questions found in any exam.</p>
                    </div>
                  ) : (
                    <div className="qm-table-wrapper">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Exam Name</th>
                            <th>Question Count</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.questionsByExam.map((item, idx) => (
                            <tr key={idx}>
                              <td><strong style={{ color: 'var(--text)' }}>{item.examName || 'Unknown Exam'}</strong></td>
                              <td>
                                <span className="qm-count-badge">{item.count}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              ) : (
                <div className="qm-empty">
                  <i className="bi bi-exclamation-triangle" />
                  <p>Failed to load statistics.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionManagerDashboard;
