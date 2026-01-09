import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const ResultManagerDashboard = () => {
  const { token } = useAuth();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchResults = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/results`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load results');
      const data = await res.json();
      setResults(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchResults();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div>
      <h2>Result Manager Dashboard</h2>
      <p>View and verify results.</p>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {loading ? (
        <p>Loading results...</p>
      ) : results.length === 0 ? (
        <p>No exam attempts yet.</p>
      ) : (
        <table border="1" cellPadding="4" style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th>Exam</th>
              <th>Student</th>
              <th>Email</th>
              <th>Score</th>
              <th>Completed</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r._id}>
                <td>{r.exam_id?.exam_name}</td>
                <td>{r.student_id?.full_name}</td>
                <td>{r.student_id?.email}</td>
                <td>{r.total_score}</td>
                <td>{r.completed ? 'Yes' : 'No'}</td>
                <td>{new Date(r.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ResultManagerDashboard;

