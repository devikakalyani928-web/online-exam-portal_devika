import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

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

  const tabStyle = (isActive) => ({
    padding: '0.75rem 1.5rem',
    border: 'none',
    background: isActive ? '#ffc107' : '#f0f0f0',
    color: isActive ? 'black' : 'black',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: isActive ? 'bold' : 'normal',
    borderBottom: isActive ? '3px solid #e0a800' : '3px solid transparent',
  });

  return (
    <div style={{ padding: '1rem', maxWidth: '1400px', margin: '0 auto' }}>
      <h2>Question Manager Dashboard</h2>
      <p>Create, maintain, and manage the question bank</p>

      {error && <p style={{ color: 'red', padding: '0.5rem', background: '#ffebee', borderRadius: '4px' }}>{error}</p>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '2px solid #ddd' }}>
        <button style={tabStyle(activeTab === 'manage')} onClick={() => setActiveTab('manage')}>
          Manage by Exam
        </button>
        <button style={tabStyle(activeTab === 'questionBank')} onClick={() => setActiveTab('questionBank')}>
          Question Bank
        </button>
        <button style={tabStyle(activeTab === 'stats')} onClick={() => setActiveTab('stats')}>
          Statistics
        </button>
      </div>

      {/* Manage by Exam Tab */}
      {activeTab === 'manage' && (
        <div>
          <section style={{ marginBottom: '1rem' }}>
            <h3>Select Exam</h3>
            {exams.length === 0 ? (
              <p>No exams available. Ask Exam Manager to create exams first.</p>
            ) : (
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                style={{ padding: '0.5rem', fontSize: '1rem', minWidth: 300 }}
              >
                {exams.map((exam) => (
                  <option key={exam._id} value={exam._id}>
                    {exam.exam_name}
                  </option>
                ))}
              </select>
            )}
          </section>

          {selectedExamId && (
            <>
              {!editMode ? (
                <section style={{ marginBottom: '2rem' }}>
                  <h3>Add Question</h3>
                  <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 600 }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Question Text</label>
                      <textarea
                        name="question_text"
                        placeholder="Enter your question here..."
                        value={form.question_text}
                        onChange={handleChange}
                        required
                        rows={3}
                        style={{ width: '100%', padding: '0.5rem', fontSize: '1rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Option 1</label>
                      <input name="option1" value={form.option1} onChange={handleChange} required style={{ width: '100%', padding: '0.5rem', fontSize: '1rem' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Option 2</label>
                      <input name="option2" value={form.option2} onChange={handleChange} required style={{ width: '100%', padding: '0.5rem', fontSize: '1rem' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Option 3</label>
                      <input name="option3" value={form.option3} onChange={handleChange} required style={{ width: '100%', padding: '0.5rem', fontSize: '1rem' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Option 4</label>
                      <input name="option4" value={form.option4} onChange={handleChange} required style={{ width: '100%', padding: '0.5rem', fontSize: '1rem' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Correct Option</label>
                      <select name="correct_option" value={form.correct_option} onChange={handleChange} style={{ padding: '0.5rem', fontSize: '1rem', minWidth: 150 }}>
                        <option value={1}>Option 1</option>
                        <option value={2}>Option 2</option>
                        <option value={3}>Option 3</option>
                        <option value={4}>Option 4</option>
                      </select>
                    </div>
                    <button type="submit" style={{ padding: '0.75rem 1.5rem', cursor: 'pointer', background: '#ffc107', color: 'black', border: 'none', borderRadius: '4px', fontSize: '1rem', fontWeight: 'bold' }}>
                      Add Question
                    </button>
                  </form>
                </section>
              ) : (
                <section style={{ marginBottom: '2rem', border: '2px solid #ffc107', padding: '1rem', borderRadius: '8px' }}>
                  <h3>Edit Question</h3>
                  <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 600 }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Question Text</label>
                      <textarea name="question_text" value={editForm.question_text} onChange={handleEditChange} required rows={3} style={{ width: '100%', padding: '0.5rem', fontSize: '1rem' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Option 1</label>
                      <input name="option1" value={editForm.option1} onChange={handleEditChange} required style={{ width: '100%', padding: '0.5rem', fontSize: '1rem' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Option 2</label>
                      <input name="option2" value={editForm.option2} onChange={handleEditChange} required style={{ width: '100%', padding: '0.5rem', fontSize: '1rem' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Option 3</label>
                      <input name="option3" value={editForm.option3} onChange={handleEditChange} required style={{ width: '100%', padding: '0.5rem', fontSize: '1rem' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Option 4</label>
                      <input name="option4" value={editForm.option4} onChange={handleEditChange} required style={{ width: '100%', padding: '0.5rem', fontSize: '1rem' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Correct Option</label>
                      <select name="correct_option" value={editForm.correct_option} onChange={handleEditChange} style={{ padding: '0.5rem', fontSize: '1rem', minWidth: 150 }}>
                        <option value={1}>Option 1</option>
                        <option value={2}>Option 2</option>
                        <option value={3}>Option 3</option>
                        <option value={4}>Option 4</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button type="submit" style={{ padding: '0.5rem 1rem', cursor: 'pointer', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', fontSize: '1rem' }}>
                        Save Changes
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditMode(false);
                          setEditingQuestion(null);
                        }}
                        style={{ padding: '0.5rem 1rem', cursor: 'pointer', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', fontSize: '1rem' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </section>
              )}

              <section>
                <h3>Questions for Selected Exam ({questions.length})</h3>
                {loading ? (
                  <p>Loading questions...</p>
                ) : questions.length === 0 ? (
                  <p>No questions yet. Add your first question above.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.9rem' }}>
                      <thead style={{ background: '#f5f5f5' }}>
                        <tr>
                          <th style={{ width: '40%' }}>Question</th>
                          <th style={{ width: '35%' }}>Options</th>
                          <th style={{ width: '10%' }}>Correct</th>
                          <th style={{ width: '15%' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {questions.map((q) => (
                          <tr key={q._id} style={{ background: editingQuestion === q._id ? '#fff3cd' : 'white' }}>
                            <td>{q.question_text}</td>
                            <td>
                              <div style={{ fontSize: '0.85rem' }}>
                                1. {q.option1}
                                <br />
                                2. {q.option2}
                                <br />
                                3. {q.option3}
                                <br />
                                4. {q.option4}
                              </div>
                            </td>
                            <td>
                              <strong style={{ color: '#28a745', fontSize: '1.1rem' }}>{q.correct_option}</strong>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <button
                                  onClick={() => handleEdit(q)}
                                  style={{ padding: '0.25rem 0.75rem', cursor: 'pointer', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.85rem' }}
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(q._id)}
                                  style={{ padding: '0.25rem 0.75rem', cursor: 'pointer', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.85rem' }}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      )}

      {/* Question Bank Tab */}
      {activeTab === 'questionBank' && (
        <div>
          <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <h3>All Questions ({filteredQuestions.length})</h3>
            <input
              type="text"
              placeholder="Search questions, options, or exam name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '0.5rem', fontSize: '1rem', flex: '1', maxWidth: 400 }}
            />
          </div>
          {loading ? (
            <p>Loading questions...</p>
          ) : filteredQuestions.length === 0 ? (
            <p>No questions found{searchTerm && ` matching "${searchTerm}"`}.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.9rem' }}>
                      <thead style={{ background: '#f5f5f5' }}>
                        <tr>
                          <th>Exam</th>
                          <th>Question</th>
                          <th>Options</th>
                          <th>Correct</th>
                          <th>Created</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredQuestions.map((q) => (
                          <tr key={q._id}>
                            <td>{q.exam_id?.exam_name || 'N/A'}</td>
                            <td>{q.question_text}</td>
                            <td style={{ fontSize: '0.85rem' }}>
                              1. {q.option1}
                              <br />
                              2. {q.option2}
                              <br />
                              3. {q.option3}
                              <br />
                              4. {q.option4}
                            </td>
                            <td>
                              <strong style={{ color: '#28a745' }}>{q.correct_option}</strong>
                            </td>
                            <td>{new Date(q.createdAt).toLocaleDateString()}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <button
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
                                  style={{ padding: '0.25rem 0.75rem', cursor: 'pointer', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.85rem' }}
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(q._id)}
                                  style={{ padding: '0.25rem 0.75rem', cursor: 'pointer', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.85rem' }}
                                >
                                  Delete
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

      {/* Statistics Tab */}
      {activeTab === 'stats' && (
        <div>
          <h3>Question Bank Statistics</h3>
          {statsLoading ? (
            <p>Loading statistics...</p>
          ) : stats ? (
            <div>
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ border: '1px solid #ddd', padding: '1.5rem', borderRadius: '8px', background: '#f9f9f9', display: 'inline-block', minWidth: 250 }}>
                  <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>Total Questions</div>
                  <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#ffc107' }}>{stats.totalQuestions}</div>
                </div>
              </div>

              <h4>Questions by Exam</h4>
              {stats.questionsByExam.length === 0 ? (
                <p>No questions found in any exam.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.9rem' }}>
                    <thead style={{ background: '#f5f5f5' }}>
                      <tr>
                        <th>Exam Name</th>
                        <th>Question Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.questionsByExam.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.examName || 'Unknown Exam'}</td>
                          <td>
                            <strong style={{ color: '#ffc107' }}>{item.count}</strong>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <p>Failed to load statistics.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default QuestionManagerDashboard;
