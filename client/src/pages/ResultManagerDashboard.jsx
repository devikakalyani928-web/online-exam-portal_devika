import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const ResultManagerDashboard = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('allResults');
  const [results, setResults] = useState([]);
  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [attemptDetails, setAttemptDetails] = useState(null);
  const [stats, setStats] = useState(null);
  const [examReport, setExamReport] = useState(null);
  const [selectedExamForReport, setSelectedExamForReport] = useState('');
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchResults = async () => {
    try {
      setLoading(true);
      let url = `${API_BASE}/api/results`;
      if (selectedExam) {
        url = `${API_BASE}/api/results/${selectedExam}`;
      } else if (selectedStudent) {
        url = `${API_BASE}/api/results/student/${selectedStudent}`;
      }
      const res = await fetch(url, {
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

  const fetchExams = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/exams`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load exams');
      const data = await res.json();
      setExams(data);
    } catch (err) {
      console.error('Error fetching exams:', err);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/users/students`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load students');
      const data = await res.json();
      setStudents(data);
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  };

  const fetchAttemptDetails = async (attemptId) => {
    try {
      setDetailsLoading(true);
      const res = await fetch(`${API_BASE}/api/results/attempt/${attemptId}/details`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load attempt details');
      const data = await res.json();
      setAttemptDetails(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setDetailsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const res = await fetch(`${API_BASE}/api/results/stats`, {
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

  const fetchExamReport = async (examId) => {
    if (!examId) return;
    try {
      setReportLoading(true);
      const res = await fetch(`${API_BASE}/api/results/exam/${examId}/report`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load exam report');
      const data = await res.json();
      setExamReport(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchResults();
      fetchExams();
      fetchStudents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (token && (selectedExam || selectedStudent)) {
      fetchResults();
    } else if (token && !selectedExam && !selectedStudent && activeTab === 'allResults') {
      fetchResults();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedExam, selectedStudent, token]);

  useEffect(() => {
    if (token && activeTab === 'statistics') {
      fetchStats();
    }
  }, [token, activeTab]);

  useEffect(() => {
    if (selectedAttempt && activeTab === 'allResults') {
      fetchAttemptDetails(selectedAttempt);
    }
  }, [selectedAttempt, activeTab, token]);

  useEffect(() => {
    if (selectedExamForReport && activeTab === 'reports') {
      fetchExamReport(selectedExamForReport);
    }
  }, [selectedExamForReport, activeTab, token]);

  const tabStyle = (isActive) => ({
    padding: '0.75rem 1.5rem',
    border: 'none',
    background: isActive ? '#17a2b8' : '#f0f0f0',
    color: isActive ? 'white' : 'black',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: isActive ? 'bold' : 'normal',
    borderBottom: isActive ? '3px solid #138496' : '3px solid transparent',
  });

  return (
    <div style={{ padding: '1rem', maxWidth: '1400px', margin: '0 auto' }}>
      <h2>Result Manager Dashboard</h2>
      <p>View, verify, and generate result summaries and reports (Read-only access)</p>

      {error && <p style={{ color: 'red', padding: '0.5rem', background: '#ffebee', borderRadius: '4px' }}>{error}</p>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '2px solid #ddd' }}>
        <button style={tabStyle(activeTab === 'allResults')} onClick={() => setActiveTab('allResults')}>
          All Results
        </button>
        <button style={tabStyle(activeTab === 'statistics')} onClick={() => setActiveTab('statistics')}>
          Statistics
        </button>
        <button style={tabStyle(activeTab === 'reports')} onClick={() => setActiveTab('reports')}>
          Exam Reports
        </button>
      </div>

      {/* All Results Tab */}
      {activeTab === 'allResults' && (
        <div>
          <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <label style={{ marginRight: '0.5rem', fontWeight: 'bold' }}>Filter by Exam:</label>
              <select
                value={selectedExam}
                onChange={(e) => {
                  setSelectedExam(e.target.value);
                  setSelectedStudent('');
                }}
                style={{ padding: '0.5rem', fontSize: '1rem', minWidth: 200 }}
              >
                <option value="">All Exams</option>
                {exams.map((exam) => (
                  <option key={exam._id} value={exam._id}>
                    {exam.exam_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ marginRight: '0.5rem', fontWeight: 'bold' }}>Filter by Student:</label>
              <select
                value={selectedStudent}
                onChange={(e) => {
                  setSelectedStudent(e.target.value);
                  setSelectedExam('');
                }}
                style={{ padding: '0.5rem', fontSize: '1rem', minWidth: 200 }}
              >
                <option value="">All Students</option>
                {students.map((student) => (
                  <option key={student._id} value={student._id}>
                    {student.full_name} ({student.email})
                  </option>
                ))}
              </select>
            </div>
            {selectedAttempt && (
              <button
                onClick={() => {
                  setSelectedAttempt(null);
                  setAttemptDetails(null);
                }}
                style={{ padding: '0.5rem 1rem', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Close Details
              </button>
            )}
          </div>

          {selectedAttempt && attemptDetails ? (
            <div style={{ border: '2px solid #17a2b8', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
              <h3>Detailed Attempt View</h3>
              {detailsLoading ? (
                <p>Loading details...</p>
              ) : (
                <div>
                  <div style={{ marginBottom: '1rem', padding: '1rem', background: '#f9f9f9', borderRadius: '4px' }}>
                    <p>
                      <strong>Exam:</strong> {attemptDetails.attempt.exam_id?.exam_name}
                    </p>
                    <p>
                      <strong>Student:</strong> {attemptDetails.attempt.student_id?.full_name} ({attemptDetails.attempt.student_id?.email})
                    </p>
                    <p>
                      <strong>Score:</strong> {attemptDetails.attempt.total_score} / {attemptDetails.answers.length}
                    </p>
                    <p>
                      <strong>Status:</strong>{' '}
                      <span style={{ color: attemptDetails.attempt.completed ? 'green' : 'orange', fontWeight: 'bold' }}>
                        {attemptDetails.attempt.completed ? 'Completed' : 'In Progress'}
                      </span>
                    </p>
                    <p>
                      <strong>Started:</strong> {new Date(attemptDetails.attempt.start_time).toLocaleString()}
                    </p>
                    {attemptDetails.attempt.end_time && (
                      <p>
                        <strong>Submitted:</strong> {new Date(attemptDetails.attempt.end_time).toLocaleString()}
                      </p>
                    )}
                  </div>

                  <h4>Answers:</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {attemptDetails.answers.map((answer, idx) => (
                      <div
                        key={answer._id}
                        style={{
                          border: '1px solid #ddd',
                          padding: '1rem',
                          borderRadius: '4px',
                          background: answer.is_correct ? '#d4edda' : '#f8d7da',
                        }}
                      >
                        <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                          Question {idx + 1}: {answer.question_id?.question_text}
                        </p>
                        <div style={{ marginLeft: '1rem', fontSize: '0.9rem' }}>
                          <p>1. {answer.question_id?.option1}</p>
                          <p>2. {answer.question_id?.option2}</p>
                          <p>3. {answer.question_id?.option3}</p>
                          <p>4. {answer.question_id?.option4}</p>
                        </div>
                        <p style={{ marginTop: '0.5rem' }}>
                          <strong>Student Selected:</strong> Option {answer.selected_option}
                          {answer.is_correct ? (
                            <span style={{ color: 'green', marginLeft: '0.5rem' }}>✓ Correct</span>
                          ) : (
                            <span style={{ color: 'red', marginLeft: '0.5rem' }}>
                              ✗ Incorrect (Correct: Option {answer.question_id?.correct_option})
                            </span>
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <h3>All Results ({results.length})</h3>
              {loading ? (
                <p>Loading results...</p>
              ) : results.length === 0 ? (
                <p>No exam attempts found.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.9rem' }}>
                    <thead style={{ background: '#f5f5f5' }}>
                      <tr>
                        <th>Exam</th>
                        <th>Student</th>
                        <th>Email</th>
                        <th>Score</th>
                        <th>Status</th>
                        <th>Started</th>
                        <th>Submitted</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((r) => (
                        <tr key={r._id}>
                          <td>{r.exam_id?.exam_name || 'N/A'}</td>
                          <td>{r.student_id?.full_name || r.student_id?.username || 'N/A'}</td>
                          <td>{r.student_id?.email || 'N/A'}</td>
                          <td>
                            <strong style={{ color: r.completed ? (r.total_score >= 50 ? 'green' : 'red') : '#666' }}>
                              {r.completed ? r.total_score : '-'}
                            </strong>
                          </td>
                          <td>
                            <span style={{ color: r.completed ? 'green' : 'orange', fontWeight: 'bold' }}>
                              {r.completed ? 'Completed' : 'In Progress'}
                            </span>
                          </td>
                          <td>{new Date(r.start_time).toLocaleString()}</td>
                          <td>{r.end_time ? new Date(r.end_time).toLocaleString() : '-'}</td>
                          <td>
                            <button
                              onClick={() => setSelectedAttempt(r._id)}
                              style={{ padding: '0.25rem 0.75rem', cursor: 'pointer', background: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.85rem' }}
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Statistics Tab */}
      {activeTab === 'statistics' && (
        <div>
          <h3>Result Statistics</h3>
          {statsLoading ? (
            <p>Loading statistics...</p>
          ) : stats ? (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ border: '1px solid #ddd', padding: '1.5rem', borderRadius: '8px', background: '#f9f9f9' }}>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>Total Attempts</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#17a2b8' }}>{stats.overview.totalAttempts}</div>
                </div>
                <div style={{ border: '1px solid #ddd', padding: '1.5rem', borderRadius: '8px', background: '#f9f9f9' }}>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>Completed</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#28a745' }}>{stats.overview.completedAttempts}</div>
                </div>
                <div style={{ border: '1px solid #ddd', padding: '1.5rem', borderRadius: '8px', background: '#f9f9f9' }}>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>Pending</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ffc107' }}>{stats.overview.pendingAttempts}</div>
                </div>
                <div style={{ border: '1px solid #ddd', padding: '1.5rem', borderRadius: '8px', background: '#f9f9f9' }}>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>Average Score</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#6f42c1' }}>{stats.overview.averageScore}</div>
                </div>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <h4>Statistics by Exam</h4>
                {stats.examStats.length === 0 ? (
                  <p>No exam statistics available.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.9rem' }}>
                      <thead style={{ background: '#f5f5f5' }}>
                        <tr>
                          <th>Exam</th>
                          <th>Total Attempts</th>
                          <th>Average Score</th>
                          <th>Highest Score</th>
                          <th>Lowest Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.examStats.map((stat, idx) => (
                          <tr key={idx}>
                            <td>{stat.examName || 'Unknown'}</td>
                            <td>{stat.totalAttempts}</td>
                            <td>{stat.avgScore}</td>
                            <td>{stat.maxScore}</td>
                            <td>{stat.minScore}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div>
                <h4>Top 10 Students (by Average Score)</h4>
                {stats.topStudents.length === 0 ? (
                  <p>No student statistics available.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.9rem' }}>
                      <thead style={{ background: '#f5f5f5' }}>
                        <tr>
                          <th>Rank</th>
                          <th>Student</th>
                          <th>Total Attempts</th>
                          <th>Average Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.topStudents.map((student, idx) => (
                          <tr key={idx}>
                            <td>#{idx + 1}</td>
                            <td>{student.studentName}</td>
                            <td>{student.totalAttempts}</td>
                            <td>
                              <strong style={{ color: '#28a745' }}>{student.avgScore}</strong>
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
            <p>Failed to load statistics.</p>
          )}
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ marginRight: '0.5rem', fontWeight: 'bold' }}>Select Exam for Report:</label>
            <select
              value={selectedExamForReport}
              onChange={(e) => setSelectedExamForReport(e.target.value)}
              style={{ padding: '0.5rem', fontSize: '1rem', minWidth: 300 }}
            >
              <option value="">-- Select an Exam --</option>
              {exams.map((exam) => (
                <option key={exam._id} value={exam._id}>
                  {exam.exam_name}
                </option>
              ))}
            </select>
          </div>

          {selectedExamForReport && (
            <>
              {reportLoading ? (
                <p>Loading report...</p>
              ) : examReport ? (
                <div>
                  <div style={{ border: '2px solid #17a2b8', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', background: '#f9f9f9' }}>
                    <h3>Exam Report: {examReport.exam.exam_name}</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                      <div>
                        <strong>Total Questions:</strong> {examReport.questions.total}
                      </div>
                      <div>
                        <strong>Total Students:</strong> {examReport.statistics.totalStudents}
                      </div>
                      <div>
                        <strong>Completed:</strong> {examReport.statistics.completed}
                      </div>
                      <div>
                        <strong>Ongoing:</strong> {examReport.statistics.ongoing}
                      </div>
                      <div>
                        <strong>Average Score:</strong> {examReport.statistics.averageScore}
                      </div>
                      <div>
                        <strong>Highest Score:</strong> {examReport.statistics.highestScore}
                      </div>
                      <div>
                        <strong>Lowest Score:</strong> {examReport.statistics.lowestScore}
                      </div>
                      <div>
                        <strong>Passed:</strong> {examReport.statistics.passCount}
                      </div>
                      <div>
                        <strong>Failed:</strong> {examReport.statistics.failCount}
                      </div>
                    </div>
                  </div>

                  <h4>All Attempts</h4>
                  {examReport.attempts.all.length === 0 ? (
                    <p>No attempts for this exam.</p>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.9rem' }}>
                        <thead style={{ background: '#f5f5f5' }}>
                          <tr>
                            <th>Student</th>
                            <th>Email</th>
                            <th>Score</th>
                            <th>Status</th>
                            <th>Started</th>
                            <th>Submitted</th>
                          </tr>
                        </thead>
                        <tbody>
                          {examReport.attempts.all.map((attempt) => (
                            <tr key={attempt._id}>
                              <td>{attempt.student_id?.full_name || attempt.student_id?.username}</td>
                              <td>{attempt.student_id?.email}</td>
                              <td>
                                <strong style={{ color: attempt.completed ? (attempt.total_score >= examReport.questions.total / 2 ? 'green' : 'red') : '#666' }}>
                                  {attempt.completed ? `${attempt.total_score} / ${examReport.questions.total}` : '-'}
                                </strong>
                              </td>
                              <td>
                                <span style={{ color: attempt.completed ? 'green' : 'orange', fontWeight: 'bold' }}>
                                  {attempt.completed ? 'Completed' : 'In Progress'}
                                </span>
                              </td>
                              <td>{new Date(attempt.start_time).toLocaleString()}</td>
                              <td>{attempt.end_time ? new Date(attempt.end_time).toLocaleString() : '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                <p>Failed to load report.</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ResultManagerDashboard;
