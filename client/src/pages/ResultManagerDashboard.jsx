import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/ResultManagerDashboard.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const NAV_ITEMS = [
  { key: 'allResults', icon: 'bi-list-check',        label: 'All Results' },
  { key: 'statistics', icon: 'bi-graph-up',          label: 'Statistics' },
  { key: 'reports',    icon: 'bi-file-earmark-text', label: 'Exam Reports' },
];

const ResultManagerDashboard = () => {
  const { token, user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('allResults');
  const [sidebarOpen, setSidebarOpen] = useState(true);
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
      // Filter out any attempts with null student_id or exam_id (safety check)
      const validResults = data.filter(result => 
        result.student_id !== null && result.exam_id !== null
      );
      setResults(validResults);
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

  // Helper function to format duration
  const formatDuration = (startTime, endTime) => {
    if (!endTime) return 'N/A';
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end - start;
    const totalSeconds = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    } else {
      return `${minutes}m ${seconds}s`;
    }
  };

  // Helper function to format percentage (remove .00 if whole number, otherwise show up to 2 decimals)
  const formatPercentage = (value) => {
    if (value === 0 || value === null || value === undefined) return '0';
    const num = parseFloat(value);
    if (isNaN(num)) return '0';
    // If it's a whole number, return without decimals
    if (num % 1 === 0) {
      return num.toString();
    }
    // Otherwise, show up to 2 decimal places, removing trailing zeros
    return parseFloat(num.toFixed(2)).toString();
  };

  return (
    <div className="rm-dashboard">
      {/* ── Background blobs ── */}
      <div className="rm-bg-effects">
        <div className="rm-blob rm-blob-1" />
        <div className="rm-blob rm-blob-2" />
        <div className="rm-blob rm-blob-3" />
      </div>

      {/* ── Sidebar ── */}
      <aside className={`rm-sidebar ${!sidebarOpen ? 'collapsed' : ''}`}>
        <div className="rm-sidebar-header">
          <div className="rm-sidebar-logo">
            <i className="bi bi-clipboard-data-fill" />
            <span className="rm-sidebar-logo-text">Result Manager</span>
          </div>
          {sidebarOpen && (
            <button className="rm-sidebar-toggle" onClick={() => setSidebarOpen(false)}>
              <i className="bi bi-chevron-left" />
            </button>
          )}
        </div>

        <nav className="rm-sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              className={`rm-sidebar-nav-item ${activeTab === item.key ? 'active' : ''}`}
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

        <div className="rm-sidebar-footer">
          <button
            className="rm-sidebar-nav-item rm-sidebar-logout-btn"
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
        className={`rm-sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ── Main area ── */}
      <div className={`rm-main ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
        {/* Top bar */}
        <header className="rm-topbar">
          {!sidebarOpen && (
            <button className="rm-expand-btn" onClick={() => setSidebarOpen(true)}>
              <i className="bi bi-chevron-right" />
            </button>
          )}
          <button className="rm-mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
            <i className="bi bi-list" />
          </button>
          <div className="rm-topbar-title">
            <h1>{NAV_ITEMS.find((n) => n.key === activeTab)?.label}</h1>
          </div>
          <div className="rm-topbar-actions">
            <div className="rm-topbar-user-chip">
              <div className="rm-topbar-avatar" title={user?.full_name || 'Result Manager'}>
                {user?.full_name?.charAt(0)?.toUpperCase() || 'R'}
              </div>
              <div className="rm-topbar-user-info">
                <span className="rm-topbar-username">{user?.full_name || 'Result Manager'}</span>
                <span className="rm-topbar-role">{user?.role}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="rm-content">
          {/* Error alert */}
          {error && (
            <div className="rm-alert rm-alert-danger">
              <i className="bi bi-exclamation-triangle-fill" />
              <span>{error}</span>
              <button onClick={() => setError('')}>
                <i className="bi bi-x-lg" />
              </button>
            </div>
          )}

          {/* ═══ ALL RESULTS TAB ═══ */}
          {activeTab === 'allResults' && (
            <div>
              <div className="rm-filter-section">
                <div className="rm-filter-group">
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
                  className="btn-rm-secondary"
                  onClick={() => {
                    setSelectedAttempt(null);
                    setAttemptDetails(null);
                  }}
                >
                  <i className="bi bi-x-circle" /> Close Details
                </button>
            )}
          </div>

          {selectedAttempt && attemptDetails ? (
            <div className="rm-glass-card attempt-details-card">
              <div className="rm-glass-card-header">
                <h3 className="mb-0">
                  <i className="bi bi-eye me-2"></i>Detailed Attempt View
                </h3>
              </div>
              <div style={{ padding: '1.5rem' }}>
                {detailsLoading ? (
                  <div className="rm-loading">
                    <div className="rm-spinner" />
                  </div>
                ) : (
                  <div>
                    {(() => {
                      const totalMarks = attemptDetails.answers.length;
                      const marksObtained = attemptDetails.attempt.total_score;
                      const percentageValue = totalMarks > 0 ? ((marksObtained / totalMarks) * 100) : 0;
                      const percentage = formatPercentage(percentageValue);
                      const isPassed = percentageValue >= 40;
                      return (
                        <div className="attempt-details-grid">
                          {/* Left Column */}
                          <div className="attempt-details-column">
                            <div className="attempt-details-item">
                              <div className="attempt-details-label">
                                <i className="bi bi-file-earmark-text"></i>
                                <span>Exam</span>
                              </div>
                              <div className="attempt-details-value">{attemptDetails.attempt.exam_id?.exam_name || 'N/A'}</div>
                            </div>
                            <div className="attempt-details-item">
                              <div className="attempt-details-label">
                                <i className="bi bi-list-check"></i>
                                <span>Total Marks</span>
                              </div>
                              <div className="attempt-details-value">{totalMarks}</div>
                            </div>
                            <div className="attempt-details-item">
                              <div className="attempt-details-label">
                                <i className="bi bi-trophy"></i>
                                <span>Marks Obtained</span>
                              </div>
                              <div className="attempt-details-value">{marksObtained}</div>
                            </div>
                            <div className="attempt-details-item">
                              <div className="attempt-details-label">
                                <i className="bi bi-percent"></i>
                                <span>Percentage</span>
                              </div>
                              <div className="attempt-details-value">{percentage}%</div>
                            </div>
                            <div className="attempt-details-item">
                              <div className="attempt-details-label">
                                <i className="bi bi-award"></i>
                                <span>Result</span>
                              </div>
                              <div className="attempt-details-value">
                                <span className={`rm-status-badge ${isPassed ? 'rm-status-passed' : 'rm-status-failed'}`}>
                                  <i className={`bi ${isPassed ? 'bi-check-circle' : 'bi-x-circle'}`}></i>
                                  {isPassed ? 'Passed' : 'Failed'}
                                </span>
                              </div>
                            </div>
                          </div>
                          {/* Right Column */}
                          <div className="attempt-details-column">
                            <div className="attempt-details-item">
                              <div className="attempt-details-label">
                                <i className="bi bi-person"></i>
                                <span>Student</span>
                              </div>
                              <div className="attempt-details-value">
                                {attemptDetails.attempt.student_id?.full_name || 'N/A'}
                                {attemptDetails.attempt.student_id?.email && (
                                  <span className="attempt-details-email"> ({attemptDetails.attempt.student_id.email})</span>
                                )}
                              </div>
                            </div>
                            <div className="attempt-details-item">
                              <div className="attempt-details-label">
                                <i className="bi bi-info-circle"></i>
                                <span>Status</span>
                              </div>
                              <div className="attempt-details-value">
                                <span className={`rm-status-badge ${attemptDetails.attempt.completed ? 'rm-status-completed' : 'rm-status-pending'}`}>
                                  <i className={`bi ${attemptDetails.attempt.completed ? 'bi-check-circle' : 'bi-clock'}`}></i>
                                  {attemptDetails.attempt.completed ? 'Completed' : 'In Progress'}
                                </span>
                              </div>
                            </div>
                            <div className="attempt-details-item">
                              <div className="attempt-details-label">
                                <i className="bi bi-play-circle"></i>
                                <span>Started</span>
                              </div>
                              <div className="attempt-details-value">{new Date(attemptDetails.attempt.start_time).toLocaleString('en-GB')}</div>
                            </div>
                            {attemptDetails.attempt.end_time && (
                              <div className="attempt-details-item">
                                <div className="attempt-details-label">
                                  <i className="bi bi-check-circle"></i>
                                  <span>Submitted</span>
                                </div>
                                <div className="attempt-details-value">{new Date(attemptDetails.attempt.end_time).toLocaleString('en-GB')}</div>
                              </div>
                            )}
                            {attemptDetails.attempt.end_time && (
                              <div className="attempt-details-item">
                                <div className="attempt-details-label">
                                  <i className="bi bi-clock-history"></i>
                                  <span>Duration Taken</span>
                                </div>
                                <div className="attempt-details-value">{formatDuration(attemptDetails.attempt.start_time, attemptDetails.attempt.end_time)}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {(() => {
                      const totalQuestions = attemptDetails.answers.length;
                      const correctAnswers = attemptDetails.answers.filter(a => a.is_correct === true).length;
                      const wrongAnswers = attemptDetails.answers.filter(a => a.selected_option != null && a.is_correct === false).length;
                      const unanswered = attemptDetails.answers.filter(a => a.selected_option == null || a.selected_option === undefined).length;
                      const accuracyValue = totalQuestions > 0 ? ((correctAnswers / totalQuestions) * 100) : 0;
                      const accuracy = formatPercentage(accuracyValue);
                      
                      return (
                        <div className="performance-summary">
                          <h4 className="performance-summary-title">
                            <i className="bi bi-graph-up"></i>
                            <span>Performance Summary</span>
                          </h4>
                          <div className="performance-summary-grid">
                            <div className="performance-summary-item">
                              <div className="performance-summary-icon">
                                <i className="bi bi-list-ul"></i>
                              </div>
                              <div className="performance-summary-content">
                                <div className="performance-summary-label">Total Questions</div>
                                <div className="performance-summary-value">{totalQuestions}</div>
                              </div>
                            </div>
                            <div className="performance-summary-item">
                              <div className="performance-summary-icon performance-summary-icon-success">
                                <i className="bi bi-check-circle-fill"></i>
                              </div>
                              <div className="performance-summary-content">
                                <div className="performance-summary-label">Correct Answers</div>
                                <div className="performance-summary-value" style={{ color: 'var(--green)' }}>{correctAnswers}</div>
                              </div>
                            </div>
                            <div className="performance-summary-item">
                              <div className="performance-summary-icon performance-summary-icon-danger">
                                <i className="bi bi-x-circle-fill"></i>
                              </div>
                              <div className="performance-summary-content">
                                <div className="performance-summary-label">Wrong Answers</div>
                                <div className="performance-summary-value" style={{ color: 'var(--red)' }}>{wrongAnswers}</div>
                              </div>
                            </div>
                            <div className="performance-summary-item">
                              <div className="performance-summary-icon performance-summary-icon-warning">
                                <i className="bi bi-dash-circle"></i>
                              </div>
                              <div className="performance-summary-content">
                                <div className="performance-summary-label">Unanswered</div>
                                <div className="performance-summary-value" style={{ color: 'var(--amber)' }}>{unanswered}</div>
                              </div>
                            </div>
                            <div className="performance-summary-item performance-summary-item-full">
                              <div className="performance-summary-icon">
                                <i className="bi bi-speedometer2"></i>
                              </div>
                              <div className="performance-summary-content">
                                <div className="performance-summary-label">Accuracy</div>
                                <div className="performance-summary-value">{accuracy}%</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rm-glass-card">
              <div className="rm-glass-card-header">
                <h3 className="mb-0">
                  <i className="bi bi-list-check me-2"></i>All Results ({results.length})
                </h3>
              </div>
              <div className="card-body">
                {loading ? (
                  <div className="rm-loading">
                    <div className="rm-spinner" />
                  </div>
                ) : results.length === 0 ? (
                  <div className="rm-empty">
                    <i className="bi bi-inbox"></i>
                    <p>No exam attempts found.</p>
                  </div>
                ) : (
                  <div className="rm-table-wrapper">
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
                              <strong className={`score-display ${(() => {
                                if (!r.completed) return 'score-pending';
                                // Use stored is_passed if available
                                if (r.is_passed !== undefined) {
                                  return r.is_passed ? 'score-pass' : 'score-fail';
                                }
                                // Fallback: we don't have total questions here, so we can't calculate percentage
                                // This should not happen for new records, but for old records, default to fail
                                return 'score-fail';
                              })()}`}>
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
                                className="btn-rm-info btn-rm-sm"
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
          <div className="rm-glass-card">
            <div className="rm-glass-card-header">
              <h3 className="mb-0">
                <i className="bi bi-graph-up-arrow me-2"></i>Result Statistics
              </h3>
            </div>
            <div className="card-body">
              {statsLoading ? (
                <div className="rm-loading">
                  <div className="rm-spinner" />
                </div>
              ) : stats ? (
                <div>
                  <div className="rm-stats-grid">
                    <div className="rm-stat-card">
                      <div className="rm-stat-label">Total Attempts</div>
                      <div className="rm-stat-value info">{stats.overview.totalAttempts}</div>
                    </div>
                    <div className="rm-stat-card">
                      <div className="rm-stat-label">Completed</div>
                      <div className="rm-stat-value success">{stats.overview.completedAttempts}</div>
                    </div>
                    <div className="rm-stat-card">
                      <div className="rm-stat-label">Pending</div>
                      <div className="rm-stat-value warning">{stats.overview.pendingAttempts}</div>
                    </div>
                    <div className="rm-stat-card">
                      <div className="rm-stat-label">Average Score</div>
                      <div className="rm-stat-value purple">{stats.overview.averageScore}</div>
                    </div>
                  </div>

                  <div className="rm-glass-card">
                    <div className="rm-glass-card-header">
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
                        <div className="rm-table-wrapper">
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

                  <div className="rm-glass-card">
                    <div className="rm-glass-card-header">
                      <h4 className="mb-0">
                        <i className="bi bi-trophy me-2"></i>Top 10 Students (by Average Score)
                      </h4>
                    </div>
                    <div className="card-body">
                      {stats.topStudents.length === 0 ? (
                        <div className="rm-empty">
                          <i className="bi bi-info-circle"></i>
                          <p>No student statistics available.</p>
                        </div>
                      ) : (
                        <div className="rm-table-wrapper">
                          <table className="table rm-top-students-table">
                            <thead>
                              <tr>
                                <th style={{ width: '80px' }}>RANK</th>
                                <th>STUDENT</th>
                                <th style={{ width: '120px', textAlign: 'right' }}>TOTAL ATTEMPTS</th>
                                <th style={{ width: '140px', textAlign: 'right' }}>AVERAGE SCORE</th>
                              </tr>
                            </thead>
                            <tbody>
                              {stats.topStudents.map((student, idx) => {
                                const nameMatch = student.studentName.match(/^(.+?)\s*\((.+?)\)$/);
                                const studentName = nameMatch ? nameMatch[1] : student.studentName;
                                const studentEmail = nameMatch ? nameMatch[2] : '';
                                
                                return (
                                  <tr key={idx}>
                                    <td>
                                      <span className="rm-rank-badge">#{idx + 1}</span>
                                    </td>
                                    <td>
                                      <div className="rm-student-info">
                                        <strong className="rm-student-name">{studentName}</strong>
                                        {studentEmail && (
                                          <span className="rm-student-email">{studentEmail}</span>
                                        )}
                                      </div>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>{student.totalAttempts}</td>
                                    <td style={{ textAlign: 'right' }}>
                                      <strong className="rm-score-value">{student.avgScore}</strong>
                                    </td>
                                  </tr>
                                );
                              })}
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
          <div className="rm-glass-card">
            <div className="card-body">
              <div className="rm-filter-group">
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
                <div className="rm-loading">
                  <div className="rm-spinner" />
                </div>
              ) : examReport ? (
                <div>
                  <div className="rm-glass-card" style={{ marginBottom: '1.5rem' }}>
                    <div className="rm-glass-card-header">
                      <h3 className="mb-0">
                        <i className="bi bi-file-earmark-text me-2"></i>Exam Report: {examReport.exam.exam_name}
                      </h3>
                    </div>
                    <div style={{ padding: '1.5rem' }}>
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
                          <span style={{ color: 'var(--green)' }}>{examReport.statistics.completed}</span>
                        </div>
                        <div className="exam-report-stat-item">
                          <strong>Ongoing:</strong>
                          <span style={{ color: 'var(--amber)' }}>{examReport.statistics.ongoing}</span>
                        </div>
                        <div className="exam-report-stat-item">
                          <strong>Average Score:</strong>
                          <span>{examReport.statistics.averageScore}</span>
                        </div>
                        <div className="exam-report-stat-item">
                          <strong>Highest Score:</strong>
                          <span style={{ color: 'var(--green)' }}>{examReport.statistics.highestScore}</span>
                        </div>
                        <div className="exam-report-stat-item">
                          <strong>Lowest Score:</strong>
                          <span style={{ color: 'var(--red)' }}>{examReport.statistics.lowestScore}</span>
                        </div>
                        <div className="exam-report-stat-item">
                          <strong>Passed:</strong>
                          <span style={{ color: 'var(--green)' }}>{examReport.statistics.passCount}</span>
                        </div>
                        <div className="exam-report-stat-item">
                          <strong>Failed:</strong>
                          <span style={{ color: 'var(--red)' }}>{examReport.statistics.failCount}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rm-glass-card">
                    <div className="rm-glass-card-header">
                      <h4 className="mb-0">
                        <i className="bi bi-list-check me-2"></i>All Attempts
                      </h4>
                    </div>
                    <div style={{ padding: '0' }}>
                      {examReport.attempts.all.length === 0 ? (
                        <div className="rm-empty">
                          <i className="bi bi-inbox"></i>
                          <p>No attempts for this exam.</p>
                        </div>
                      ) : (
                        <div className="rm-table-wrapper">
                          <table className="table">
                            <thead>
                              <tr>
                                <th>STUDENT</th>
                                <th>EMAIL</th>
                                <th>SCORE</th>
                                <th>STATUS</th>
                                <th>STARTED</th>
                                <th>SUBMITTED</th>
                              </tr>
                            </thead>
                            <tbody>
                              {examReport.attempts.all.map((attempt) => (
                                <tr key={attempt._id}>
                                  <td style={{ color: 'var(--text)' }}>{attempt.student_id?.full_name || attempt.student_id?.username || 'N/A'}</td>
                                  <td style={{ color: 'var(--text-secondary)' }}>{attempt.student_id?.email || 'N/A'}</td>
                                  <td>
                                    <strong className={`rm-score ${(() => {
                                      if (!attempt.completed) return 'rm-score-pending';
                                      // Use stored is_passed if available, otherwise calculate with percentage >= 40
                                      if (attempt.is_passed !== undefined) {
                                        return attempt.is_passed ? 'rm-score-pass' : 'rm-score-fail';
                                      }
                                      // Fallback: calculate percentage
                                      const percentage = examReport.questions.total > 0 
                                        ? (attempt.total_score / examReport.questions.total) * 100 
                                        : 0;
                                      return percentage >= 40 ? 'rm-score-pass' : 'rm-score-fail';
                                    })()}`}>
                                      {attempt.completed ? `${attempt.total_score} / ${examReport.questions.total}` : '-'}
                                    </strong>
                                  </td>
                                  <td>
                                    <span className={`rm-status-badge ${attempt.completed ? 'rm-status-completed' : 'rm-status-pending'}`}>
                                      <i className={`bi ${attempt.completed ? 'bi-check-circle' : 'bi-clock'}`} style={{ marginRight: '0.35rem' }}></i>
                                      {attempt.completed ? 'Completed' : 'In Progress'}
                                    </span>
                                  </td>
                                  <td style={{ color: 'var(--text-secondary)' }}>{new Date(attempt.start_time).toLocaleString('en-GB')}</td>
                                  <td style={{ color: 'var(--text-secondary)' }}>{attempt.end_time ? new Date(attempt.end_time).toLocaleString('en-GB') : '-'}</td>
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
                <div className="rm-empty">
                  <i className="bi bi-exclamation-triangle"></i>
                  <p>Failed to load report.</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
        </div>
      </div>
    </div>
  );
};

export default ResultManagerDashboard;
