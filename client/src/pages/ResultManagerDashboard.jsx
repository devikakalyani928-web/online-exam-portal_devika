import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/ResultManagerDashboard.css';

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

  return (
    <div className="result-manager-dashboard">
      <div className="dashboard-header">
        <h2><i className="bi bi-clipboard-data"></i> Result Manager Dashboard</h2>
        <p className="text-muted">View, verify, and generate result summaries and reports (Read-only access)</p>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')} aria-label="Close"></button>
        </div>
      )}

      {/* Tabs */}
      <ul className="nav nav-tabs result-manager-tabs" role="tablist">
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'allResults' ? 'active' : ''}`}
            onClick={() => setActiveTab('allResults')}
            type="button"
          >
            <i className="bi bi-list-check me-2"></i>All Results
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'statistics' ? 'active' : ''}`}
            onClick={() => setActiveTab('statistics')}
            type="button"
          >
            <i className="bi bi-graph-up me-2"></i>Statistics
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
            type="button"
          >
            <i className="bi bi-file-earmark-text me-2"></i>Exam Reports
          </button>
        </li>
      </ul>

      {/* All Results Tab */}
      {activeTab === 'allResults' && (
        <div>
          <div className="filter-section">
            <div className="filter-group">
              <label htmlFor="filter-exam">
                <i className="bi bi-funnel me-2"></i>Filter by Exam:
              </label>
              <select
                id="filter-exam"
                className="form-select"
                value={selectedExam}
                onChange={(e) => {
                  setSelectedExam(e.target.value);
                  setSelectedStudent('');
                }}
                style={{ minWidth: '200px' }}
              >
                <option value="">All Exams</option>
                {exams.map((exam) => (
                  <option key={exam._id} value={exam._id}>
                    {exam.exam_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="filter-student">
                <i className="bi bi-person me-2"></i>Filter by Student:
              </label>
              <select
                id="filter-student"
                className="form-select"
                value={selectedStudent}
                onChange={(e) => {
                  setSelectedStudent(e.target.value);
                  setSelectedExam('');
                }}
                style={{ minWidth: '200px' }}
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
                className="btn btn-secondary"
                onClick={() => {
                  setSelectedAttempt(null);
                  setAttemptDetails(null);
                }}
              >
                <i className="bi bi-x-circle me-2"></i>Close Details
              </button>
            )}
          </div>

          {selectedAttempt && attemptDetails ? (
            <div className="card attempt-details-card">
              <div className="card-header">
                <h3 className="mb-0">
                  <i className="bi bi-eye me-2"></i>Detailed Attempt View
                </h3>
              </div>
              <div className="card-body">
                {detailsLoading ? (
                  <div className="loading-container">
                    <div className="spinner-border text-info" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="attempt-details-header">
                      <div className="row">
                        <div className="col-md-6 mb-2">
                          <strong><i className="bi bi-file-earmark-text me-2"></i>Exam:</strong> {attemptDetails.attempt.exam_id?.exam_name}
                        </div>
                        <div className="col-md-6 mb-2">
                          <strong><i className="bi bi-person me-2"></i>Student:</strong> {attemptDetails.attempt.student_id?.full_name} ({attemptDetails.attempt.student_id?.email})
                        </div>
                        <div className="col-md-6 mb-2">
                          <strong><i className="bi bi-trophy me-2"></i>Score:</strong> {attemptDetails.attempt.total_score} / {attemptDetails.answers.length}
                        </div>
                        <div className="col-md-6 mb-2">
                          <strong><i className="bi bi-info-circle me-2"></i>Status:</strong>{' '}
                          <span className={`status-badge ${attemptDetails.attempt.completed ? 'status-completed' : 'status-pending'}`}>
                            <i className={`bi ${attemptDetails.attempt.completed ? 'bi-check-circle' : 'bi-clock'} me-1`}></i>
                            {attemptDetails.attempt.completed ? 'Completed' : 'In Progress'}
                          </span>
                        </div>
                        <div className="col-md-6 mb-2">
                          <strong><i className="bi bi-play-circle me-2"></i>Started:</strong> {new Date(attemptDetails.attempt.start_time).toLocaleString('en-GB')}
                        </div>
                        {attemptDetails.attempt.end_time && (
                          <div className="col-md-6 mb-2">
                            <strong><i className="bi bi-check-circle me-2"></i>Submitted:</strong> {new Date(attemptDetails.attempt.end_time).toLocaleString('en-GB')}
                          </div>
                        )}
                      </div>
                    </div>

                    <h4 className="mt-4 mb-3">
                      <i className="bi bi-list-ul me-2"></i>Answers:
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {attemptDetails.answers.map((answer, idx) => (
                        <div
                          key={answer._id}
                          className={`answer-card ${answer.is_correct ? 'correct' : 'incorrect'}`}
                        >
                          <p className="fw-bold mb-2">
                            Question {idx + 1}: {answer.question_id?.question_text}
                          </p>
                          <div className="answer-options">
                            <p>1. {answer.question_id?.option1}</p>
                            <p>2. {answer.question_id?.option2}</p>
                            <p>3. {answer.question_id?.option3}</p>
                            <p>4. {answer.question_id?.option4}</p>
                          </div>
                          <p className="answer-result mt-2">
                            <strong>Student Selected:</strong> Option {answer.selected_option}
                            {answer.is_correct ? (
                              <span className="correct ms-2">
                                <i className="bi bi-check-circle-fill me-1"></i>Correct
                              </span>
                            ) : (
                              <span className="incorrect ms-2">
                                <i className="bi bi-x-circle-fill me-1"></i>Incorrect (Correct: Option {answer.question_id?.correct_option})
                              </span>
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-header">
                <h3 className="mb-0">
                  <i className="bi bi-list-check me-2"></i>All Results ({results.length})
                </h3>
              </div>
              <div className="card-body">
                {loading ? (
                  <div className="loading-container">
                    <div className="spinner-border text-info" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : results.length === 0 ? (
                  <div className="empty-container">
                    <i className="bi bi-inbox"></i>
                    <p>No exam attempts found.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
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
                              <strong className={`score-display ${r.completed ? (r.total_score >= 50 ? 'score-pass' : 'score-fail') : 'score-pending'}`}>
                                {r.completed ? r.total_score : '-'}
                              </strong>
                            </td>
                            <td>
                              <span className={`status-badge ${r.completed ? 'status-completed' : 'status-pending'}`}>
                                <i className={`bi ${r.completed ? 'bi-check-circle' : 'bi-clock'} me-1`}></i>
                                {r.completed ? 'Completed' : 'In Progress'}
                              </span>
                            </td>
                            <td>{new Date(r.start_time).toLocaleString('en-GB')}</td>
                            <td>{r.end_time ? new Date(r.end_time).toLocaleString('en-GB') : '-'}</td>
                            <td>
                              <button
                                className="btn btn-sm btn-info"
                                onClick={() => setSelectedAttempt(r._id)}
                              >
                                <i className="bi bi-eye me-1"></i>View Details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Statistics Tab */}
      {activeTab === 'statistics' && (
        <div>
          <div className="card">
            <div className="card-header">
              <h3 className="mb-0">
                <i className="bi bi-graph-up-arrow me-2"></i>Result Statistics
              </h3>
            </div>
            <div className="card-body">
              {statsLoading ? (
                <div className="loading-container">
                  <div className="spinner-border text-info" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : stats ? (
                <div>
                  <div className="stats-overview-grid">
                    <div className="stat-overview-card">
                      <div className="stat-overview-label">Total Attempts</div>
                      <div className="stat-overview-value info">{stats.overview.totalAttempts}</div>
                    </div>
                    <div className="stat-overview-card">
                      <div className="stat-overview-label">Completed</div>
                      <div className="stat-overview-value success">{stats.overview.completedAttempts}</div>
                    </div>
                    <div className="stat-overview-card">
                      <div className="stat-overview-label">Pending</div>
                      <div className="stat-overview-value warning">{stats.overview.pendingAttempts}</div>
                    </div>
                    <div className="stat-overview-card">
                      <div className="stat-overview-label">Average Score</div>
                      <div className="stat-overview-value purple">{stats.overview.averageScore}</div>
                    </div>
                  </div>

                  <div className="card mb-4">
                    <div className="card-header">
                      <h4 className="mb-0">
                        <i className="bi bi-list-ul me-2"></i>Statistics by Exam
                      </h4>
                    </div>
                    <div className="card-body">
                      {stats.examStats.length === 0 ? (
                        <div className="alert alert-info">
                          <i className="bi bi-info-circle me-2"></i>
                          No exam statistics available.
                        </div>
                      ) : (
                        <div className="table-responsive">
                          <table className="table table-hover">
                            <thead>
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
                                  <td><strong>{stat.examName || 'Unknown'}</strong></td>
                                  <td>{stat.totalAttempts}</td>
                                  <td><strong className="text-info">{stat.avgScore}</strong></td>
                                  <td><strong className="text-success">{stat.maxScore}</strong></td>
                                  <td><strong className="text-danger">{stat.minScore}</strong></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <h4 className="mb-0">
                        <i className="bi bi-trophy me-2"></i>Top 10 Students (by Average Score)
                      </h4>
                    </div>
                    <div className="card-body">
                      {stats.topStudents.length === 0 ? (
                        <div className="alert alert-info">
                          <i className="bi bi-info-circle me-2"></i>
                          No student statistics available.
                        </div>
                      ) : (
                        <div className="table-responsive">
                          <table className="table table-hover top-students-table">
                            <thead>
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
                                  <td>
                                    <span className="rank-badge">#{idx + 1}</span>
                                  </td>
                                  <td><strong>{student.studentName}</strong></td>
                                  <td>{student.totalAttempts}</td>
                                  <td>
                                    <strong className="text-success" style={{ fontSize: '1.1rem' }}>{student.avgScore}</strong>
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
                  <p>Failed to load statistics.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div>
          <div className="card mb-3">
            <div className="card-body">
              <div className="filter-group">
                <label htmlFor="report-exam">
                  <i className="bi bi-file-earmark-text me-2"></i>Select Exam for Report:
                </label>
                <select
                  id="report-exam"
                  className="form-select"
                  value={selectedExamForReport}
                  onChange={(e) => setSelectedExamForReport(e.target.value)}
                  style={{ maxWidth: '400px' }}
                >
                  <option value="">-- Select an Exam --</option>
                  {exams.map((exam) => (
                    <option key={exam._id} value={exam._id}>
                      {exam.exam_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {selectedExamForReport && (
            <>
              {reportLoading ? (
                <div className="loading-container">
                  <div className="spinner-border text-info" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : examReport ? (
                <div>
                  <div className="card exam-report-card">
                    <div className="card-header">
                      <h3 className="mb-0">
                        <i className="bi bi-file-earmark-text me-2"></i>Exam Report: {examReport.exam.exam_name}
                      </h3>
                    </div>
                    <div className="card-body">
                      <div className="exam-report-stats">
                        <div className="exam-report-stat-item">
                          <strong>Total Questions:</strong>
                          <span>{examReport.questions.total}</span>
                        </div>
                        <div className="exam-report-stat-item">
                          <strong>Total Students:</strong>
                          <span>{examReport.statistics.totalStudents}</span>
                        </div>
                        <div className="exam-report-stat-item">
                          <strong>Completed:</strong>
                          <span className="text-success">{examReport.statistics.completed}</span>
                        </div>
                        <div className="exam-report-stat-item">
                          <strong>Ongoing:</strong>
                          <span className="text-warning">{examReport.statistics.ongoing}</span>
                        </div>
                        <div className="exam-report-stat-item">
                          <strong>Average Score:</strong>
                          <span>{examReport.statistics.averageScore}</span>
                        </div>
                        <div className="exam-report-stat-item">
                          <strong>Highest Score:</strong>
                          <span className="text-success">{examReport.statistics.highestScore}</span>
                        </div>
                        <div className="exam-report-stat-item">
                          <strong>Lowest Score:</strong>
                          <span className="text-danger">{examReport.statistics.lowestScore}</span>
                        </div>
                        <div className="exam-report-stat-item">
                          <strong>Passed:</strong>
                          <span className="text-success">{examReport.statistics.passCount}</span>
                        </div>
                        <div className="exam-report-stat-item">
                          <strong>Failed:</strong>
                          <span className="text-danger">{examReport.statistics.failCount}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <h4 className="mb-0">
                        <i className="bi bi-list-check me-2"></i>All Attempts
                      </h4>
                    </div>
                    <div className="card-body">
                      {examReport.attempts.all.length === 0 ? (
                        <div className="empty-container">
                          <i className="bi bi-inbox"></i>
                          <p>No attempts for this exam.</p>
                        </div>
                      ) : (
                        <div className="table-responsive">
                          <table className="table table-hover">
                            <thead>
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
                                    <strong className={`score-display ${attempt.completed ? (attempt.total_score >= examReport.questions.total / 2 ? 'score-pass' : 'score-fail') : 'score-pending'}`}>
                                      {attempt.completed ? `${attempt.total_score} / ${examReport.questions.total}` : '-'}
                                    </strong>
                                  </td>
                                  <td>
                                    <span className={`status-badge ${attempt.completed ? 'status-completed' : 'status-pending'}`}>
                                      <i className={`bi ${attempt.completed ? 'bi-check-circle' : 'bi-clock'} me-1`}></i>
                                      {attempt.completed ? 'Completed' : 'In Progress'}
                                    </span>
                                  </td>
                                  <td>{new Date(attempt.start_time).toLocaleString('en-GB')}</td>
                                  <td>{attempt.end_time ? new Date(attempt.end_time).toLocaleString('en-GB') : '-'}</td>
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
                  <p>Failed to load report.</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ResultManagerDashboard;
