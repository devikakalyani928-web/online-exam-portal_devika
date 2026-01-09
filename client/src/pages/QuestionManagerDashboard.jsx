import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const QuestionManagerDashboard = () => {
  const { token } = useAuth();
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
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

  useEffect(() => {
    if (token) {
      fetchExams();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (selectedExamId && token) {
      fetchQuestions(selectedExamId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedExamId, token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'correct_option' ? Number(value) : value,
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!selectedExamId) {
      setError('Select an exam first');
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
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2>Question Manager Dashboard</h2>
      <p>Manage question bank per exam.</p>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <section style={{ marginBottom: '1rem' }}>
        <h3>Select Exam</h3>
        {exams.length === 0 ? (
          <p>No exams available. Ask Exam Manager to create exams first.</p>
        ) : (
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
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
          <section style={{ marginBottom: '1.5rem' }}>
            <h3>Add Question</h3>
            <form
              onSubmit={handleCreate}
              style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: 500 }}
            >
              <textarea
                name="question_text"
                placeholder="Question text"
                value={form.question_text}
                onChange={handleChange}
                required
              />
              <input
                name="option1"
                placeholder="Option 1"
                value={form.option1}
                onChange={handleChange}
                required
              />
              <input
                name="option2"
                placeholder="Option 2"
                value={form.option2}
                onChange={handleChange}
                required
              />
              <input
                name="option3"
                placeholder="Option 3"
                value={form.option3}
                onChange={handleChange}
                required
              />
              <input
                name="option4"
                placeholder="Option 4"
                value={form.option4}
                onChange={handleChange}
                required
              />
              <label>
                Correct option:
                <select
                  name="correct_option"
                  value={form.correct_option}
                  onChange={handleChange}
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                </select>
              </label>
              <button type="submit">Add Question</button>
            </form>
          </section>

          <section>
            <h3>Questions for selected exam</h3>
            {loading ? (
              <p>Loading questions...</p>
            ) : questions.length === 0 ? (
              <p>No questions yet.</p>
            ) : (
              <table border="1" cellPadding="4" style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr>
                    <th>Question</th>
                    <th>Options</th>
                    <th>Correct</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((q) => (
                    <tr key={q._id}>
                      <td>{q.question_text}</td>
                      <td>
                        1. {q.option1}
                        <br />
                        2. {q.option2}
                        <br />
                        3. {q.option3}
                        <br />
                        4. {q.option4}
                      </td>
                      <td>{q.correct_option}</td>
                      <td>
                        <button onClick={() => handleDelete(q._id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default QuestionManagerDashboard;

