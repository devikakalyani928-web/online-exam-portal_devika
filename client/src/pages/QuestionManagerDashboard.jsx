import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/QuestionManagerDashboard.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const QuestionManagerDashboard = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('manage');
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [questions, setQuestions] = useState([]);
  const [allQuestions, setAllQuestions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
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

  const fetchExams = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/exams`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load exams');
      const data = await res.json();
      setExams(data);
      if (data.length > 0 && !selectedExamId) {
        setSelectedExamId(data[0]._id);
      }
    } catch (err) {
      setError(err.message);
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
    if (token) {
      fetchExams();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (selectedExamId && token && activeTab === 'manage') {
      fetchQuestions(selectedExamId);
    }
  }, [selectedExamId, token, activeTab]);

  useEffect(() => {
    if (token && activeTab === 'questionBank') {
      fetchAllQuestions();
    }
  }, [token, activeTab]);

  useEffect(() => {
    if (token && activeTab === 'stats') {
      fetchStats();
    }
  }, [token, activeTab]);

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

    // Check for duplicates
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
      if (activeTab === 'questionBank') {
        fetchAllQuestions();
      }
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

    // Check for duplicates (excluding current question)
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
      if (activeTab === 'questionBank') {
        fetchAllQuestions();
      }
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
      if (activeTab === 'questionBank') {
        fetchAllQuestions();
      }
    } catch (err) {
      setError(err.message);
    }
  };

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

  // Group questions by exam name (subject)
  const groupedQuestions = filteredQuestions.reduce((acc, question) => {
    const examName = question.exam_id?.exam_name || 'Unassigned';
    if (!acc[examName]) {
      acc[examName] = [];
    }
    acc[examName].push(question);
    return acc;
  }, {});

  // Sort exam names alphabetically
  const sortedExamNames = Object.keys(groupedQuestions).sort();

  return (
    <div className="question-manager-dashboard">
      <div className="dashboard-header">
        <h2><i className="bi bi-question-circle"></i> Question Manager Dashboard</h2>
        <p className="text-muted">Create, maintain, and manage the question bank</p>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')} aria-label="Close"></button>
        </div>
      )}

      {/* Tabs */}
      <ul className="nav nav-tabs question-manager-tabs" role="tablist">
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'manage' ? 'active' : ''}`}
            onClick={() => setActiveTab('manage')}
            type="button"
          >
            <i className="bi bi-file-earmark-text me-2"></i>Manage by Exam
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'questionBank' ? 'active' : ''}`}
            onClick={() => setActiveTab('questionBank')}
            type="button"
          >
            <i className="bi bi-journal-text me-2"></i>Question Bank
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
            type="button"
          >
            <i className="bi bi-graph-up me-2"></i>Statistics
          </button>
        </li>
      </ul>

      {/* Manage by Exam Tab */}
      {activeTab === 'manage' && (
        <div>
          <div className="card exam-selector-section">
            <div className="card-body">
              <h3 className="mb-3">
                <i className="bi bi-funnel me-2"></i>Select Exam
              </h3>
              {exams.length === 0 ? (
                <div className="alert alert-info">
                  <i className="bi bi-info-circle me-2"></i>
                  No exams available. Ask Exam Manager to create exams first.
                </div>
              ) : (
                <select
                  className="form-select"
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  style={{ maxWidth: '400px' }}
                >
                  {exams.map((exam) => (
                    <option key={exam._id} value={exam._id}>
                      {exam.exam_name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {selectedExamId && (
            <>
              {!editMode ? (
                <div className="card question-form-card">
                  <h3>
                    <i className="bi bi-plus-circle me-2"></i>Add Question
                  </h3>
                  <form onSubmit={handleCreate}>
                    <div className="mb-3">
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
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label htmlFor="option1" className="form-label">Option 1</label>
                        <input
                          type="text"
                          className="form-control"
                          id="option1"
                          name="option1"
                          value={form.option1}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label htmlFor="option2" className="form-label">Option 2</label>
                        <input
                          type="text"
                          className="form-control"
                          id="option2"
                          name="option2"
                          value={form.option2}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label htmlFor="option3" className="form-label">Option 3</label>
                        <input
                          type="text"
                          className="form-control"
                          id="option3"
                          name="option3"
                          value={form.option3}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label htmlFor="option4" className="form-label">Option 4</label>
                        <input
                          type="text"
                          className="form-control"
                          id="option4"
                          name="option4"
                          value={form.option4}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label htmlFor="correct_option" className="form-label">Correct Option</label>
                      <select
                        className="form-select"
                        id="correct_option"
                        name="correct_option"
                        value={form.correct_option}
                        onChange={handleChange}
                        style={{ maxWidth: '200px' }}
                      >
                        <option value={1}>Option 1</option>
                        <option value={2}>Option 2</option>
                        <option value={3}>Option 3</option>
                        <option value={4}>Option 4</option>
                      </select>
                    </div>
                    <button type="submit" className="btn btn-warning">
                      <i className="bi bi-plus-circle me-2"></i>Add Question
                    </button>
                  </form>
                </div>
              ) : (
                <div className="card question-form-card edit-mode">
                  <h3>
                    <i className="bi bi-pencil-square me-2"></i>Edit Question
                  </h3>
                  <form onSubmit={handleUpdate}>
                    <div className="mb-3">
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
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label htmlFor="edit_option1" className="form-label">Option 1</label>
                        <input
                          type="text"
                          className="form-control"
                          id="edit_option1"
                          name="option1"
                          value={editForm.option1}
                          onChange={handleEditChange}
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label htmlFor="edit_option2" className="form-label">Option 2</label>
                        <input
                          type="text"
                          className="form-control"
                          id="edit_option2"
                          name="option2"
                          value={editForm.option2}
                          onChange={handleEditChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label htmlFor="edit_option3" className="form-label">Option 3</label>
                        <input
                          type="text"
                          className="form-control"
                          id="edit_option3"
                          name="option3"
                          value={editForm.option3}
                          onChange={handleEditChange}
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label htmlFor="edit_option4" className="form-label">Option 4</label>
                        <input
                          type="text"
                          className="form-control"
                          id="edit_option4"
                          name="option4"
                          value={editForm.option4}
                          onChange={handleEditChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label htmlFor="edit_correct_option" className="form-label">Correct Option</label>
                      <select
                        className="form-select"
                        id="edit_correct_option"
                        name="correct_option"
                        value={editForm.correct_option}
                        onChange={handleEditChange}
                        style={{ maxWidth: '200px' }}
                      >
                        <option value={1}>Option 1</option>
                        <option value={2}>Option 2</option>
                        <option value={3}>Option 3</option>
                        <option value={4}>Option 4</option>
                      </select>
                    </div>
                    <div className="d-flex gap-2">
                      <button type="submit" className="btn btn-success">
                        <i className="bi bi-check-circle me-2"></i>Save Changes
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          setEditMode(false);
                          setEditingQuestion(null);
                        }}
                      >
                        <i className="bi bi-x-circle me-2"></i>Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="card question-table-container">
                <div className="card-header">
                  <h3 className="mb-0">
                    <i className="bi bi-list-ul me-2"></i>Questions for Selected Exam ({questions.length})
                  </h3>
                </div>
                <div className="card-body">
                  {loading ? (
                    <div className="loading-container">
                      <div className="spinner-border text-warning" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : questions.length === 0 ? (
                    <div className="empty-container">
                      <i className="bi bi-inbox"></i>
                      <p>No questions yet. Add your first question above.</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
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
                            <tr key={q._id} className={editingQuestion === q._id ? 'question-row-editing' : ''}>
                              <td>{q.question_text}</td>
                              <td>
                                <div className="option-list">
                                  <div className="option-item">1. {q.option1}</div>
                                  <div className="option-item">2. {q.option2}</div>
                                  <div className="option-item">3. {q.option3}</div>
                                  <div className="option-item">4. {q.option4}</div>
                                </div>
                              </td>
                              <td>
                                <span className="correct-option-badge">{q.correct_option}</span>
                              </td>
                              <td>
                                <div className="table-actions">
                                  <button
                                    className="btn btn-sm btn-primary"
                                    onClick={() => handleEdit(q)}
                                  >
                                    <i className="bi bi-pencil me-1"></i>Edit
                                  </button>
                                  <button
                                    className="btn btn-sm btn-danger"
                                    onClick={() => handleDelete(q._id)}
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
            </>
          )}
        </div>
      )}

      {/* Question Bank Tab */}
      {activeTab === 'questionBank' && (
        <div>
          <div className="card">
            <div className="card-body">
              <div className="question-bank-header">
                <h3 className="mb-0">
                  <i className="bi bi-journal-text me-2"></i>All Questions ({filteredQuestions.length})
                </h3>
                <div className="input-group question-bank-search">
                  <span className="input-group-text">
                    <i className="bi bi-search"></i>
                  </span>
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
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="spinner-border text-warning" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="card">
              <div className="card-body">
                <div className="empty-container">
                  <i className="bi bi-inbox"></i>
                  <p>No questions found{searchTerm && ` matching "${searchTerm}"`}.</p>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {sortedExamNames.map((examName) => {
                const questions = groupedQuestions[examName];
                return (
                  <div key={examName} className="question-group">
                    <div className="question-group-header">
                      <span>{examName}</span>
                      <span className="question-group-count">
                        {questions.length} question{questions.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="table-responsive">
                      <table className="table table-hover question-group-table mb-0">
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
                          {questions.map((q) => (
                            <tr key={q._id} className={editingQuestion === q._id ? 'question-row-editing' : ''}>
                              <td>{q.question_text}</td>
                              <td>
                                <div className="option-list">
                                  <div className="option-item">1. {q.option1}</div>
                                  <div className="option-item">2. {q.option2}</div>
                                  <div className="option-item">3. {q.option3}</div>
                                  <div className="option-item">4. {q.option4}</div>
                                </div>
                              </td>
                              <td>
                                <span className="correct-option-badge">{q.correct_option}</span>
                              </td>
                              <td>{new Date(q.createdAt).toLocaleDateString('en-GB')}</td>
                              <td>
                                <div className="table-actions">
                                  <button
                                    className="btn btn-sm btn-primary"
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
                                    <i className="bi bi-pencil me-1"></i>Edit
                                  </button>
                                  <button
                                    className="btn btn-sm btn-danger"
                                    onClick={() => handleDelete(q._id)}
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
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Statistics Tab */}
      {activeTab === 'stats' && (
        <div>
          <div className="card">
            <div className="card-header">
              <h3 className="mb-0">
                <i className="bi bi-graph-up-arrow me-2"></i>Question Bank Statistics
              </h3>
            </div>
            <div className="card-body">
              {statsLoading ? (
                <div className="loading-container">
                  <div className="spinner-border text-warning" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : stats ? (
                <div>
                  <div className="stats-card">
                    <div className="stats-card-label">Total Questions</div>
                    <div className="stats-card-value">{stats.totalQuestions}</div>
                  </div>

                  <h4 className="mt-4 mb-3">
                    <i className="bi bi-list-ul me-2"></i>Questions by Exam
                  </h4>
                  {stats.questionsByExam.length === 0 ? (
                    <div className="alert alert-info">
                      <i className="bi bi-info-circle me-2"></i>
                      No questions found in any exam.
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Exam Name</th>
                            <th>Question Count</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.questionsByExam.map((item, idx) => (
                            <tr key={idx}>
                              <td><strong>{item.examName || 'Unknown Exam'}</strong></td>
                              <td>
                                <span className="badge bg-warning text-dark" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                                  {item.count}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                <div className="empty-container">
                  <i className="bi bi-exclamation-triangle"></i>
                  <p>Failed to load statistics.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionManagerDashboard;
