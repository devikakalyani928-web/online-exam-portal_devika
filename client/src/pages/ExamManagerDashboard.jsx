import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const ExamManagerDashboard = () => {
  const { token } = useAuth();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
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

  useEffect(() => {
    if (token) {
      fetchExams();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === 'duration' ? Number(value) : value }));
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
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2>Exam Manager Dashboard</h2>
      <p>Create and manage exams.</p>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <section style={{ marginBottom: '1.5rem' }}>
        <h3>Create Exam</h3>
        <form
          onSubmit={handleCreate}
          style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: 400 }}
        >
          <input
            name="exam_name"
            placeholder="Exam name"
            value={form.exam_name}
            onChange={handleChange}
            required
          />
          <label>
            Start time:
            <input
              type="datetime-local"
              name="start_time"
              value={form.start_time}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            End time:
            <input
              type="datetime-local"
              name="end_time"
              value={form.end_time}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Duration (minutes):
            <input
              type="number"
              name="duration"
              value={form.duration}
              onChange={handleChange}
              min={1}
              required
            />
          </label>
          <button type="submit">Create Exam</button>
        </form>
      </section>

      <section>
        <h3>Existing Exams</h3>
        {loading ? (
          <p>Loading exams...</p>
        ) : exams.length === 0 ? (
          <p>No exams found.</p>
        ) : (
          <table border="1" cellPadding="4" style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Start</th>
                <th>End</th>
                <th>Duration (min)</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((exam) => (
                <tr key={exam._id}>
                  <td>{exam.exam_name}</td>
                  <td>{new Date(exam.start_time).toLocaleString()}</td>
                  <td>{new Date(exam.end_time).toLocaleString()}</td>
                  <td>{exam.duration}</td>
                  <td>{exam.is_active ? 'Yes' : 'No'}</td>
                  <td>
                    <button onClick={() => handleToggleActive(exam._id, exam.is_active)}>
                      {exam.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};

export default ExamManagerDashboard;

