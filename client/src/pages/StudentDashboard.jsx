import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/StudentDashboard.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const StudentDashboard = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('exams');
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [examStartTime, setExamStartTime] = useState(null);
  const [loading, setLoading] = useState(false);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [myResults, setMyResults] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [resultDetails, setResultDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

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
      console.error('Error fetching results:', err);
    }
  };

  const fetchResultDetails = async (attemptId) => {
    try {
      setDetailsLoading(true);
      // Check if the attempt is completed before fetching details
      const attempt = myResults.find((r) => r._id === attemptId);
      if (!attempt || !attempt.completed) {
        setResultDetails(null);
        setDetailsLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE}/api/results/student/me/${attemptId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        if (res.status === 400) {
          // 400 means exam not yet completed - this is expected
          setResultDetails(null);
          setDetailsLoading(false);
          return;
        }
        throw new Error('Failed to load result details');
      }
      const data = await res.json();
      setResultDetails(data);
      setError('');
    } catch (err) {
      // Don't show error for 400 (incomplete exam) - it's expected
      if (err.message !== 'Failed to load result details' || !err.message.includes('400')) {
        setError(err.message);
      }
      setResultDetails(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAvailableExams();
      fetchMyResults();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (selectedResult && activeTab === 'results') {
      // Only fetch details if the attempt is completed
      const attempt = myResults.find((r) => r._id === selectedResult);
      if (attempt && attempt.completed) {
        fetchResultDetails(selectedResult);
      } else {
        setResultDetails(null);
        setDetailsLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedResult, activeTab, token, myResults]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Use refs to store latest values for the timer
  const selectedExamRef = useRef(selectedExam);
  const answersRef = useRef(answers);
  const tokenRef = useRef(token);

  useEffect(() => {
    selectedExamRef.current = selectedExam;
    answersRef.current = answers;
    tokenRef.current = token;
  }, [selectedExam, answers, token]);

  // Timer effect
  useEffect(() => {
    if (!selectedExam || !examStartTime || result) return;

    const interval = setInterval(async () => {
      const now = new Date();
      const elapsed = Math.floor((now - examStartTime) / 1000); // seconds
      const durationMinutes = selectedExam.duration;
      const totalSeconds = durationMinutes * 60;
      const remaining = totalSeconds - elapsed;

      if (remaining <= 0) {
        setTimeRemaining(0);
        // Auto-submit when time runs out
        const currentAnswers = answersRef.current;
        if (Object.keys(currentAnswers).length > 0) {
          const currentExam = selectedExamRef.current;
          const currentToken = tokenRef.current;
          
          if (!currentExam) {
            clearInterval(interval);
            return;
          }

          const payloadAnswers = Object.entries(currentAnswers).map(([question_id, selected_option]) => ({
            question_id,
            selected_option,
          }));

          try {
            const res = await fetch(`${API_BASE}/api/exams/${currentExam._id}/submit`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${currentToken}`,
              },
              body: JSON.stringify({ answers: payloadAnswers }),
            });
            const data = await res.json();
            if (!res.ok) {
              throw new Error(data?.message || 'Failed to submit exam');
            }
            setResult(data);
            setTimeRemaining(null);
            // Refresh exams and results after submission
            const examsRes = await fetch(`${API_BASE}/api/exams/available`, {
              headers: { Authorization: `Bearer ${currentToken}` },
            });
            if (examsRes.ok) {
              const examsData = await examsRes.json();
              setExams(examsData);
            }
            const resultsRes = await fetch(`${API_BASE}/api/results/student/me`, {
              headers: { Authorization: `Bearer ${currentToken}` },
            });
            if (resultsRes.ok) {
              const resultsData = await resultsRes.json();
              setMyResults(resultsData);
            }
          } catch (err) {
            setError(err.message);
          }
        }
        clearInterval(interval);
      } else {
        setTimeRemaining(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedExam, examStartTime, result]);

  const submitExam = async () => {
    if (!selectedExam) return;
    
    // Validate that all questions are answered
    const answeredCount = Object.keys(answers).length;
    const totalQuestions = questions.length;
    
    if (answeredCount < totalQuestions) {
      const unansweredCount = totalQuestions - answeredCount;
      setError(`You have ${unansweredCount} unanswered question${unansweredCount > 1 ? 's' : ''}. Please complete all questions before submitting.`);
      return;
    }
    
    const payloadAnswers = Object.entries(answers).map(([question_id, selected_option]) => ({
      question_id,
      selected_option,
    }));

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
      setTimeRemaining(null);
      // Refresh exams and results after submission
      const examsRes = await fetch(`${API_BASE}/api/exams/available`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (examsRes.ok) {
        const examsData = await examsRes.json();
        setExams(examsData);
      }
      const resultsRes = await fetch(`${API_BASE}/api/results/student/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resultsRes.ok) {
        const resultsData = await resultsRes.json();
        setMyResults(resultsData);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const startExam = async (exam) => {
    // Strict retake prevention: Block only if exam is completed
    if (exam.attemptCompleted) {
      setError('You have already completed this exam. You cannot retake it.');
      return;
    }

    // If attempted but not completed, allow continuing (backend will return existing attempt)
    // This enforces "only once" - they can continue but not start fresh
    // Allow continuing even if exam time window has passed (for incomplete attempts)

    // Only check canStart for NEW attempts, not for continuing incomplete attempts
    if (!exam.attempted && exam.canStart === false) {
      setError(`This exam is ${exam.status || 'not available'} right now. Please try within the exam time window.`);
      return;
    }

    setSelectedExam(exam);
    setQuestions([]);
    setAnswers({});
    setResult(null);
    setError('');
    setTimeRemaining(null);
    setExamStartTime(null);
    setQuestionsLoading(true);

    try {
      const startRes = await fetch(`${API_BASE}/api/exams/${exam._id}/start`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!startRes.ok) {
        const errorData = await startRes.json().catch(() => ({}));
        const errorMessage = errorData?.message || 'Failed to start exam';
        // Log the error for debugging
        console.error('Start exam API error:', {
          status: startRes.status,
          statusText: startRes.statusText,
          message: errorMessage,
          examId: exam._id,
          attempted: exam.attempted,
          attemptCompleted: exam.attemptCompleted,
        });
        throw new Error(errorMessage);
      }

      const startData = await startRes.json();
      setExamStartTime(new Date(startData.start_time || new Date()));

      const questionsRes = await fetch(`${API_BASE}/api/exams/${exam._id}/questions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!questionsRes.ok) throw new Error('Failed to load questions');
      const questionsData = await questionsRes.json();
      setQuestions(questionsData);
      setQuestionsLoading(false);
    } catch (err) {
      setError(err.message);
      setSelectedExam(null);
      setQuestionsLoading(false);
    }
  };

  const handleAnswerChange = (questionId, selected_option) => {
    setAnswers((prev) => ({ ...prev, [questionId]: selected_option }));
  };

  const resetExam = () => {
    setSelectedExam(null);
    setQuestions([]);
    setAnswers({});
    setResult(null);
    setTimeRemaining(null);
    setExamStartTime(null);
    setError('');
  };

  const answeredCount = Object.keys(answers).length;
  const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  return (
    <div className="student-dashboard">
      <div className="dashboard-header">
        <h2><i className="bi bi-mortarboard"></i> Student Dashboard</h2>
        <p className="text-muted">Take exams and view your results</p>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')} aria-label="Close"></button>
        </div>
      )}

      {/* Tabs */}
      {!selectedExam && (
        <ul className="nav nav-tabs student-tabs" role="tablist">
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link ${activeTab === 'exams' ? 'active' : ''}`}
              onClick={() => setActiveTab('exams')}
              type="button"
            >
              <i className="bi bi-file-earmark-text me-2"></i>Available Exams
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link ${activeTab === 'results' ? 'active' : ''}`}
              onClick={() => setActiveTab('results')}
              type="button"
            >
              <i className="bi bi-clipboard-check me-2"></i>My Results
            </button>
          </li>
        </ul>
      )}

      {/* Exam Taking View */}
      {selectedExam && !result && (
        <div className="card exam-taking-card">
          {questionsLoading ? (
            <div className="text-center p-5">
              <div className="spinner-border text-success mb-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <h3>Loading Exam...</h3>
              <p className="text-muted">Please wait while we load the questions.</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center p-5">
              <i className="bi bi-exclamation-triangle text-warning" style={{ fontSize: '3rem' }}></i>
              <h3 className="mt-3">No Questions Available</h3>
              <p className="text-muted">This exam doesn't have any questions yet. Please contact your instructor.</p>
              <button className="btn btn-secondary mt-3" onClick={resetExam}>
                <i className="bi bi-arrow-left me-2"></i>Go Back
              </button>
            </div>
          ) : (
            <>
              <div className="exam-header">
                <div>
                  <h3>Exam: {selectedExam.exam_name}</h3>
                  <p className="exam-meta">
                    <i className="bi bi-clock me-2"></i>Duration: {selectedExam.duration} minutes | 
                    <i className="bi bi-question-circle me-2 ms-2"></i>Questions: {questions.length}
                  </p>
                </div>
                {timeRemaining !== null && (
                  <div className={`timer-display ${timeRemaining < 300 ? 'warning' : ''}`}>
                    <i className="bi bi-stopwatch me-2"></i>
                    Time Remaining: {formatTime(timeRemaining)}
                  </div>
                )}
              </div>

              <div className="progress-section">
                <div className="progress-header">
                  <span>
                    <i className="bi bi-check-circle me-2"></i>Progress: {answeredCount} / {questions.length} answered
                  </span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="progress-bar-container">
                  <div
                    className={`progress-bar-fill ${progress === 100 ? 'complete' : ''}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="questions-container">
                {questions.map((q, idx) => (
                  <div
                    key={q._id}
                    className={`question-card ${answers[q._id] ? 'answered' : ''}`}
                  >
                    <h5>
                      Question {idx + 1}: {q.question_text}
                    </h5>
                    <div>
                      {[1, 2, 3, 4].map((opt) => (
                        <label
                          key={opt}
                          className={`option-label ${answers[q._id] === opt ? 'selected' : ''}`}
                        >
                          <input
                            type="radio"
                            name={q._id}
                            value={opt}
                            checked={answers[q._id] === opt}
                            onChange={() => handleAnswerChange(q._id, opt)}
                          />
                          <span>{q[`option${opt}`]}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="exam-actions">
                <button className="btn btn-secondary" onClick={resetExam}>
                  <i className="bi bi-x-circle me-2"></i>Cancel
                </button>
                <button
                  className={`btn ${answeredCount === 0 ? 'btn-secondary' : answeredCount < questions.length ? 'btn-warning' : 'btn-success'}`}
                  onClick={submitExam}
                  disabled={answeredCount === 0}
                  title={answeredCount < questions.length ? `You have ${questions.length - answeredCount} unanswered question${questions.length - answeredCount > 1 ? 's' : ''}` : 'Submit your exam'}
                >
                  <i className="bi bi-check-circle me-2"></i>
                  Submit Exam {answeredCount < questions.length && `(${answeredCount}/${questions.length})`}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Result View */}
      {result && selectedExam && (
        <div className="card result-success-card">
          <h3 className="text-success">
            <i className="bi bi-check-circle-fill me-2"></i>Exam Submitted Successfully!
          </h3>
          <div className="score-display-large">
            Your Score: {result.total_score} / {result.total_questions}
            <span className={`score-percentage ${result.total_score >= result.total_questions / 2 ? 'pass' : 'fail'}`}>
              ({Math.round((result.total_score / result.total_questions) * 100)}%)
            </span>
          </div>
          <p className="text-muted">You can view detailed results in the "My Results" tab.</p>
          <button
            className="btn btn-info mt-3"
            onClick={() => {
              resetExam();
              setActiveTab('results');
            }}
          >
            <i className="bi bi-clipboard-check me-2"></i>View My Results
          </button>
        </div>
      )}

      {/* Available Exams Tab */}
      {!selectedExam && activeTab === 'exams' && (
        <div>
          <div className="card">
            <div className="card-header">
              <h3 className="mb-0">
                <i className="bi bi-file-earmark-text me-2"></i>Available Exams
              </h3>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="loading-container">
                  <div className="spinner-border text-success" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : exams.length === 0 ? (
                <div className="empty-container">
                  <i className="bi bi-inbox"></i>
                  <p>No active exams available at the moment.</p>
                </div>
              ) : (
                <div className="exam-cards-grid">
                  {exams.map((exam) => (
                    <div
                      key={exam._id}
                      className={`exam-card ${exam.attempted ? 'attempted' : ''}`}
                    >
                      <h4>{exam.exam_name}</h4>
                      <div className="exam-info">
                        <p>
                          <i className="bi bi-clock me-2"></i>Duration: {exam.duration} minutes
                        </p>
                        <p>
                          <i className="bi bi-calendar-event me-2"></i>Start: {new Date(exam.start_time).toLocaleString('en-GB')}
                        </p>
                        <p>
                          <i className="bi bi-calendar-x me-2"></i>End: {new Date(exam.end_time).toLocaleString('en-GB')}
                        </p>
                        {exam.status && (
                          <p>
                            <i className="bi bi-info-circle me-2"></i>Status:{' '}
                            <span className={`exam-status ${exam.status === 'Ongoing' ? 'ongoing' : exam.status === 'Scheduled' ? 'scheduled' : 'ended'}`}>
                              {exam.status}
                            </span>
                          </p>
                        )}
                      </div>
                      {exam.attemptCompleted ? (
                        <div>
                          <p className="attempt-message">
                            <i className="bi bi-exclamation-triangle me-2"></i>
                            You have already attempted this exam
                          </p>
                          <button className="btn btn-secondary w-100" disabled>
                            <i className="bi bi-lock me-2"></i>Start Exam
                          </button>
                        </div>
                      ) : exam.attempted && !exam.attemptCompleted ? (
                        <div>
                          <p className="in-progress-message">
                            <i className="bi bi-hourglass-split me-2"></i>Exam In Progress
                          </p>
                          <p className="text-muted small mb-2">
                            You have already started this exam. You can only continue your existing attempt.
                          </p>
                          <button className="btn btn-warning w-100" onClick={() => startExam(exam)}>
                            <i className="bi bi-play-circle me-2"></i>Continue Exam
                          </button>
                        </div>
                      ) : (
                        <button
                          className={`btn ${exam.canStart === false ? 'btn-secondary' : 'btn-success'} w-100`}
                          onClick={() => startExam(exam)}
                          disabled={exam.canStart === false}
                        >
                          {exam.canStart === false ? (
                            <>
                              <i className="bi bi-clock me-2"></i>Not Available Yet
                            </>
                          ) : (
                            <>
                              <i className="bi bi-play-circle me-2"></i>Start Exam
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* My Results Tab */}
      {!selectedExam && activeTab === 'results' && (
        <div>
          <div className="card">
            <div className="card-header">
              <h3 className="mb-0">
                <i className="bi bi-clipboard-check me-2"></i>My Results
              </h3>
            </div>
            <div className="card-body">
              {selectedResult && resultDetails ? (
                <div>
                  <button
                    className="btn btn-secondary mb-3"
                    onClick={() => {
                      setSelectedResult(null);
                      setResultDetails(null);
                    }}
                  >
                    <i className="bi bi-arrow-left me-2"></i>Back to Results List
                  </button>

                  {detailsLoading ? (
                    <div className="loading-container">
                      <div className="spinner-border text-info" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : (
                    <div className="card result-details-card">
                      <div className="card-header">
                        <h4 className="mb-0">{resultDetails.attempt.exam_id?.exam_name}</h4>
                      </div>
                      <div className="card-body">
                        <div className="result-details-header">
                          <div className="row">
                            <div className="col-md-6 mb-2">
                              <strong><i className="bi bi-trophy me-2"></i>Score:</strong> {resultDetails.attempt.total_score} / {resultDetails.answers.length}
                            </div>
                            <div className="col-md-6 mb-2">
                              <strong><i className="bi bi-percent me-2"></i>Percentage:</strong>{' '}
                              {Math.round((resultDetails.attempt.total_score / resultDetails.answers.length) * 100)}%
                            </div>
                            <div className="col-md-6 mb-2">
                              <strong><i className="bi bi-info-circle me-2"></i>Status:</strong>{' '}
                              <span className="status-badge status-completed">
                                <i className="bi bi-check-circle me-1"></i>Completed
                              </span>
                            </div>
                            <div className="col-md-6 mb-2">
                              <strong><i className="bi bi-calendar-check me-2"></i>Submitted:</strong> {new Date(resultDetails.attempt.end_time).toLocaleString('en-GB')}
                            </div>
                          </div>
                        </div>

                        <h4 className="mt-4 mb-3">
                          <i className="bi bi-list-ul me-2"></i>Your Answers:
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {resultDetails.answers.map((answer, idx) => (
                            <div
                              key={answer._id}
                              className={`answer-review-card ${answer.is_correct ? 'correct' : 'incorrect'}`}
                            >
                              <p className="fw-bold mb-2">
                                Question {idx + 1}: {answer.question_id?.question_text}
                              </p>
                              <div className="answer-review-options">
                                <p>1. {answer.question_id?.option1}</p>
                                <p>2. {answer.question_id?.option2}</p>
                                <p>3. {answer.question_id?.option3}</p>
                                <p>4. {answer.question_id?.option4}</p>
                              </div>
                              <p className="answer-review-result mt-2">
                                <strong>Your Answer:</strong> Option {answer.selected_option}
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
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {myResults.length === 0 ? (
                    <div className="empty-container">
                      <i className="bi bi-inbox"></i>
                      <p>No exam attempts yet. Start taking exams from the "Available Exams" tab!</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Exam</th>
                            <th>Score</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {myResults.map((att) => {
                            // Get total questions count from exam
                            const totalQuestions = att.exam_id?.questionsCount || 0;
                            const scoreDisplay = att.completed && att.total_score !== undefined 
                              ? totalQuestions > 0 
                                ? `${att.total_score} / ${totalQuestions}`
                                : `${att.total_score}`
                              : '-';
                            const percentage = att.completed && totalQuestions > 0 && att.total_score !== undefined
                              ? Math.round((att.total_score / totalQuestions) * 100)
                              : null;
                            const isPassing = percentage !== null && percentage >= 50;

                            return (
                              <tr key={att._id}>
                                <td>{att.exam_id?.exam_name || 'N/A'}</td>
                                <td>
                                  {att.completed ? (
                                    <div>
                                      <strong className={`score-display ${isPassing ? 'score-pass' : 'score-fail'}`}>
                                        {scoreDisplay}
                                      </strong>
                                      {percentage !== null && (
                                        <span className="text-muted ms-2" style={{ fontSize: '0.85rem' }}>
                                          ({percentage}%)
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    '-'
                                  )}
                                </td>
                                <td>
                                  <span className={`status-badge ${att.completed ? 'status-completed' : 'status-pending'}`}>
                                    <i className={`bi ${att.completed ? 'bi-check-circle' : 'bi-clock'} me-1`}></i>
                                    {att.completed ? 'Completed' : 'In Progress'}
                                  </span>
                                </td>
                                <td>{new Date(att.createdAt).toLocaleString('en-GB')}</td>
                                <td>
                                  {att.completed ? (
                                    <button
                                      className="btn btn-sm btn-info"
                                      onClick={() => setSelectedResult(att._id)}
                                    >
                                      <i className="bi bi-eye me-1"></i>View Details
                                    </button>
                                  ) : (
                                    <span className="text-muted" style={{ fontSize: '0.85rem' }}>Not completed</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
