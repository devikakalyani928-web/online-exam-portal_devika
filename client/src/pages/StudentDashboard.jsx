import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const StudentDashboard = () => {
  const { token } = useAuth();
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [myResults, setMyResults] = useState([]);

  const fetchAvailableExams = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/exams/available`, {
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

  const fetchMyResults = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/results/student/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load results');
      const data = await res.json();
      setMyResults(data);
    } catch (err) {
      // non-fatal
    }
  };

  useEffect(() => {
    if (token) {
      fetchAvailableExams();
      fetchMyResults();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const startExam = async (exam) => {
    setSelectedExam(exam);
    setQuestions([]);
    setAnswers({});
    setResult(null);
    setError('');
    try {
      // start attempt (idempotent per design: backend blocks retake)
      await fetch(`${API_BASE}/api/exams/${exam._id}/start`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // ignore error here; backend will respond if already attempted
    }
    try {
      const res = await fetch(`${API_BASE}/api/exams/${exam._id}/questions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load questions');
      const data = await res.json();
      setQuestions(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAnswerChange = (questionId, selected_option) => {
    setAnswers((prev) => ({ ...prev, [questionId]: selected_option }));
  };

  const submitExam = async () => {
    if (!selectedExam) return;
    const payloadAnswers = Object.entries(answers).map(([question_id, selected_option]) => ({
      question_id,
      selected_option,
    }));
    if (payloadAnswers.length === 0) {
      setError('Please answer at least one question');
      return;
    }
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/exams/${selectedExam._id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ answers: payloadAnswers }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || 'Failed to submit exam');
      }
      setResult(data);
      fetchAvailableExams();
      fetchMyResults();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2>Student Dashboard</h2>
      <p>Take exams and view results.</p>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <section style={{ marginBottom: '1.5rem' }}>
        <h3>Available Exams</h3>
        {loading ? (
          <p>Loading exams...</p>
        ) : exams.length === 0 ? (
          <p>No active exams at the moment.</p>
        ) : (
          <ul>
            {exams.map((exam) => (
              <li key={exam._id}>
                {exam.exam_name}{' '}
                <button onClick={() => startExam(exam)}>Start / Continue</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {selectedExam && questions.length > 0 && (
        <section style={{ marginBottom: '1.5rem' }}>
          <h3>Exam: {selectedExam.exam_name}</h3>
          {questions.map((q) => (
            <div key={q._id} style={{ marginBottom: '1rem' }}>
              <p>{q.question_text}</p>
              {[1, 2, 3, 4].map((opt) => (
                <label key={opt} style={{ display: 'block' }}>
                  <input
                    type="radio"
                    name={q._id}
                    value={opt}
                    checked={answers[q._id] === opt}
                    onChange={() => handleAnswerChange(q._id, opt)}
                  />
                  {q[`option${opt}`]}
                </label>
              ))}
            </div>
          ))}
          <button onClick={submitExam}>Submit Exam</button>
          {result && (
            <p>
              Score: {result.total_score} / {result.total_questions}
            </p>
          )}
        </section>
      )}

      <section>
        <h3>My Results</h3>
        {myResults.length === 0 ? (
          <p>No attempts yet.</p>
        ) : (
          <table border="1" cellPadding="4" style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th>Exam</th>
                <th>Score</th>
                <th>Completed</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {myResults.map((att) => (
                <tr key={att._id}>
                  <td>{att.exam_id?.exam_name}</td>
                  <td>{att.total_score}</td>
                  <td>{att.completed ? 'Yes' : 'No'}</td>
                  <td>{new Date(att.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};

export default StudentDashboard;

