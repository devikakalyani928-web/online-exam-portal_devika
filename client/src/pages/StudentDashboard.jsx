import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

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

  const tabStyle = (isActive) => ({
    padding: '0.75rem 1.5rem',
    border: 'none',
    background: isActive ? '#28a745' : '#f0f0f0',
    color: isActive ? 'white' : 'black',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: isActive ? 'bold' : 'normal',
    borderBottom: isActive ? '3px solid #1e7e34' : '3px solid transparent',
  });

  return (
    <div style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h2>Student Dashboard</h2>
      <p>Take exams and view your results</p>

      {error && <p style={{ color: 'red', padding: '0.5rem', background: '#ffebee', borderRadius: '4px' }}>{error}</p>}

      {/* Tabs */}
      {!selectedExam && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '2px solid #ddd' }}>
          <button style={tabStyle(activeTab === 'exams')} onClick={() => setActiveTab('exams')}>
            Available Exams
          </button>
          <button style={tabStyle(activeTab === 'results')} onClick={() => setActiveTab('results')}>
            My Results
          </button>
        </div>
      )}

      {/* Exam Taking View */}
      {selectedExam && !result && (
        <div style={{ border: '2px solid #28a745', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
          {questionsLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <h3>Loading Exam...</h3>
              <p>Please wait while we load the questions.</p>
            </div>
          ) : questions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <h3>No Questions Available</h3>
              <p>This exam doesn't have any questions yet. Please contact your instructor.</p>
              <button
                onClick={resetExam}
                style={{ padding: '0.75rem 1.5rem', cursor: 'pointer', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', fontSize: '1rem', marginTop: '1rem' }}
              >
                Go Back
              </button>
            </div>
          ) : (
            <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ margin: 0 }}>Exam: {selectedExam.exam_name}</h3>
              <p style={{ margin: '0.5rem 0', color: '#666' }}>
                Duration: {selectedExam.duration} minutes | Questions: {questions.length}
              </p>
            </div>
            {timeRemaining !== null && (
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: timeRemaining < 300 ? 'red' : '#28a745' }}>
                Time Remaining: {formatTime(timeRemaining)}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>Progress: {answeredCount} / {questions.length} answered</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div style={{ width: '100%', height: '20px', background: '#e0e0e0', borderRadius: '10px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  background: progress === 100 ? '#28a745' : '#17a2b8',
                  transition: 'width 0.3s',
                }}
              />
            </div>
          </div>

          <div style={{ maxHeight: '60vh', overflowY: 'auto', marginBottom: '1rem' }}>
            {questions.map((q, idx) => (
              <div
                key={q._id}
                style={{
                  marginBottom: '1.5rem',
                  padding: '1rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  background: answers[q._id] ? '#e8f5e9' : 'white',
                }}
              >
                <p style={{ fontWeight: 'bold', marginBottom: '0.75rem' }}>
                  Question {idx + 1}: {q.question_text}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {[1, 2, 3, 4].map((opt) => (
                    <label
                      key={opt}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0.5rem',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        background: answers[q._id] === opt ? '#c8e6c9' : 'transparent',
                        border: answers[q._id] === opt ? '2px solid #4caf50' : '1px solid #ddd',
                      }}
                    >
                      <input
                        type="radio"
                        name={q._id}
                        value={opt}
                        checked={answers[q._id] === opt}
                        onChange={() => handleAnswerChange(q._id, opt)}
                        style={{ marginRight: '0.75rem', cursor: 'pointer' }}
                      />
                      <span>{q[`option${opt}`]}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              onClick={resetExam}
              style={{ padding: '0.75rem 1.5rem', cursor: 'pointer', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', fontSize: '1rem' }}
            >
              Cancel
            </button>
            <button
              onClick={submitExam}
              disabled={answeredCount === 0}
              style={{
                padding: '0.75rem 1.5rem',
                cursor: answeredCount === 0 ? 'not-allowed' : 'pointer',
                background: answeredCount === 0 ? '#ccc' : answeredCount < questions.length ? '#ff9800' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '1rem',
                fontWeight: 'bold',
              }}
              title={answeredCount < questions.length ? `You have ${questions.length - answeredCount} unanswered question${questions.length - answeredCount > 1 ? 's' : ''}` : 'Submit your exam'}
            >
              Submit Exam {answeredCount < questions.length && `(${answeredCount}/${questions.length})`}
            </button>
          </div>
            </>
          )}
        </div>
      )}

      {/* Result View */}
      {result && selectedExam && (
        <div style={{ border: '2px solid #28a745', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', background: '#f1f8f4' }}>
          <h3 style={{ color: '#28a745', marginTop: 0 }}>Exam Submitted Successfully!</h3>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Your Score: {result.total_score} / {result.total_questions}
            <span style={{ marginLeft: '1rem', color: result.total_score >= result.total_questions / 2 ? '#28a745' : '#dc3545' }}>
              ({Math.round((result.total_score / result.total_questions) * 100)}%)
            </span>
          </div>
          <p style={{ color: '#666' }}>You can view detailed results in the "My Results" tab.</p>
          <button
            onClick={() => {
              resetExam();
              setActiveTab('results');
            }}
            style={{ padding: '0.75rem 1.5rem', cursor: 'pointer', background: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', fontSize: '1rem', marginTop: '1rem' }}
          >
            View My Results
          </button>
        </div>
      )}

      {/* Available Exams Tab */}
      {!selectedExam && activeTab === 'exams' && (
        <div>
          <h3>Available Exams</h3>
          {loading ? (
            <p>Loading exams...</p>
          ) : exams.length === 0 ? (
            <p>No active exams available at the moment.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {exams.map((exam) => (
                <div
                  key={exam._id}
                  style={{
                    border: '1px solid #ddd',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    background: exam.attempted ? '#f5f5f5' : 'white',
                  }}
                >
                  <h4 style={{ marginTop: 0 }}>{exam.exam_name}</h4>
                  <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
                    <p>Duration: {exam.duration} minutes</p>
                    <p>Start: {new Date(exam.start_time).toLocaleString()}</p>
                    <p>End: {new Date(exam.end_time).toLocaleString()}</p>
                    {exam.status && (
                      <p>
                        Status:{' '}
                        <strong style={{ color: exam.status === 'Ongoing' ? 'green' : exam.status === 'Scheduled' ? '#007bff' : 'red' }}>
                          {exam.status}
                        </strong>
                      </p>
                    )}
                  </div>
                  {exam.attemptCompleted ? (
                    <div>
                      <p style={{ color: '#dc3545', fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                        You have already attempted this exam
                      </p>
                      <button
                        disabled
                        style={{
                          padding: '0.75rem 1.5rem',
                          cursor: 'not-allowed',
                          background: '#ccc',
                          color: '#666',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '1rem',
                          fontWeight: 'bold',
                          width: '100%',
                          opacity: 0.6,
                        }}
                      >
                        Start Exam
                      </button>
                    </div>
                  ) : exam.attempted && !exam.attemptCompleted ? (
                    <div>
                      <p style={{ color: '#ff9800', fontWeight: 'bold', marginBottom: '0.5rem' }}>⏳ Exam In Progress</p>
                      <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>
                        You have already started this exam. You can only continue your existing attempt.
                      </p>
                      <button
                        onClick={() => startExam(exam)}
                        style={{
                          padding: '0.75rem 1.5rem',
                          cursor: 'pointer',
                          background: '#ff9800',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '1rem',
                          fontWeight: 'bold',
                          width: '100%',
                        }}
                      >
                        Continue Exam
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startExam(exam)}
                      disabled={exam.canStart === false}
                      style={{
                        padding: '0.75rem 1.5rem',
                        cursor: exam.canStart === false ? 'not-allowed' : 'pointer',
                        background: exam.canStart === false ? '#ccc' : '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        width: '100%',
                      }}
                    >
                      {exam.canStart === false ? 'Not Available Yet' : 'Start Exam'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* My Results Tab */}
      {!selectedExam && activeTab === 'results' && (
        <div>
          <h3>My Results</h3>
          {selectedResult && resultDetails ? (
            <div>
              <button
                onClick={() => {
                  setSelectedResult(null);
                  setResultDetails(null);
                }}
                style={{ padding: '0.5rem 1rem', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginBottom: '1rem' }}
              >
                ← Back to Results List
              </button>

              {detailsLoading ? (
                <p>Loading details...</p>
              ) : (
                <div style={{ border: '2px solid #17a2b8', padding: '1.5rem', borderRadius: '8px' }}>
                  <h4>{resultDetails.attempt.exam_id?.exam_name}</h4>
                  <div style={{ marginBottom: '1rem', padding: '1rem', background: '#f9f9f9', borderRadius: '4px' }}>
                    <p>
                      <strong>Score:</strong> {resultDetails.attempt.total_score} / {resultDetails.answers.length}
                    </p>
                    <p>
                      <strong>Percentage:</strong>{' '}
                      {Math.round((resultDetails.attempt.total_score / resultDetails.answers.length) * 100)}%
                    </p>
                    <p>
                      <strong>Status:</strong>{' '}
                      <span style={{ color: 'green', fontWeight: 'bold' }}>Completed</span>
                    </p>
                    <p>
                      <strong>Submitted:</strong> {new Date(resultDetails.attempt.end_time).toLocaleString()}
                    </p>
                  </div>

                  <h4>Your Answers:</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {resultDetails.answers.map((answer, idx) => (
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
                        <div style={{ marginLeft: '1rem', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                          <p>1. {answer.question_id?.option1}</p>
                          <p>2. {answer.question_id?.option2}</p>
                          <p>3. {answer.question_id?.option3}</p>
                          <p>4. {answer.question_id?.option4}</p>
                        </div>
                        <p style={{ marginTop: '0.5rem' }}>
                          <strong>Your Answer:</strong> Option {answer.selected_option}
                          {answer.is_correct ? (
                            <span style={{ color: 'green', marginLeft: '0.5rem', fontWeight: 'bold' }}>✓ Correct</span>
                          ) : (
                            <span style={{ color: 'red', marginLeft: '0.5rem', fontWeight: 'bold' }}>
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
              {myResults.length === 0 ? (
                <p>No exam attempts yet. Start taking exams from the "Available Exams" tab!</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.9rem' }}>
                    <thead style={{ background: '#f5f5f5' }}>
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
                                  <strong style={{ color: isPassing ? 'green' : 'red' }}>
                                    {scoreDisplay}
                                  </strong>
                                  {percentage !== null && (
                                    <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
                                      ({percentage}%)
                                    </span>
                                  )}
                                </div>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td>
                              <span style={{ color: att.completed ? 'green' : 'orange', fontWeight: 'bold' }}>
                                {att.completed ? 'Completed' : 'In Progress'}
                              </span>
                            </td>
                            <td>{new Date(att.createdAt).toLocaleString()}</td>
                            <td>
                              {att.completed ? (
                                <button
                                  onClick={() => setSelectedResult(att._id)}
                                  style={{ padding: '0.25rem 0.75rem', cursor: 'pointer', background: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.85rem' }}
                                >
                                  View Details
                                </button>
                              ) : (
                                <span style={{ color: '#666', fontSize: '0.85rem' }}>Not completed</span>
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
      )}
    </div>
  );
};

export default StudentDashboard;
