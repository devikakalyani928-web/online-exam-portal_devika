const ExamAttempt = require('../models/ExamAttempt');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const StudentAnswer = require('../models/StudentAnswer');
const User = require('../models/User');

// GET /api/results (Result Manager)
const getAllResults = async (req, res) => {
  try {
    const attempts = await ExamAttempt.find()
      .populate('exam_id', 'exam_name')
      .populate('student_id', 'username full_name email');
    return res.json(attempts);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/results/:examId (Result Manager)
const getResultsByExam = async (req, res) => {
  const { examId } = req.params;
  try {
    const attempts = await ExamAttempt.find({ exam_id: examId })
      .populate('exam_id', 'exam_name')
      .populate('student_id', 'username full_name email');
    return res.json(attempts);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/results/student/me (Student)
const getMyResults = async (req, res) => {
  try {
    const attempts = await ExamAttempt.find({ student_id: req.user._id })
      .populate('exam_id', 'exam_name start_time end_time duration')
      .sort({ createdAt: -1 });
    return res.json(attempts);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/results/student/me/:attemptId (Student) - Get detailed result with answers
const getMyAttemptDetails = async (req, res) => {
  const { attemptId } = req.params;
  try {
    const attempt = await ExamAttempt.findOne({
      _id: attemptId,
      student_id: req.user._id,
    })
      .populate('exam_id', 'exam_name start_time end_time duration');

    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }

    if (!attempt.completed) {
      return res.status(400).json({ message: 'Exam not yet completed' });
    }

    const answers = await StudentAnswer.find({ attempt_id: attemptId })
      .populate('question_id', 'question_text option1 option2 option3 option4 correct_option');

    return res.json({
      attempt,
      answers,
    });
  } catch (error) {
    console.error('Error fetching student attempt details:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/results/student/:studentId (Result Manager)
const getResultsByStudent = async (req, res) => {
  const { studentId } = req.params;
  try {
    const attempts = await ExamAttempt.find({ student_id: studentId })
      .populate('exam_id', 'exam_name start_time end_time duration')
      .populate('student_id', 'username full_name email')
      .sort({ createdAt: -1 });
    return res.json(attempts);
  } catch (error) {
    console.error('Error fetching student results:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/results/attempt/:attemptId/details (Result Manager) - Get detailed attempt with answers
const getAttemptDetails = async (req, res) => {
  const { attemptId } = req.params;
  try {
    const attempt = await ExamAttempt.findById(attemptId)
      .populate('exam_id', 'exam_name start_time end_time duration')
      .populate('student_id', 'username full_name email');

    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }

    const answers = await StudentAnswer.find({ attempt_id: attemptId })
      .populate('question_id', 'question_text option1 option2 option3 option4 correct_option');

    return res.json({
      attempt,
      answers,
    });
  } catch (error) {
    console.error('Error fetching attempt details:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/results/stats (Result Manager) - Get result statistics
const getResultStats = async (req, res) => {
  try {
    const [
      totalAttempts,
      completedAttempts,
      pendingAttempts,
      avgScore,
      examStats,
      studentStats,
    ] = await Promise.all([
      ExamAttempt.countDocuments(),
      ExamAttempt.countDocuments({ completed: true }),
      ExamAttempt.countDocuments({ completed: false }),
      ExamAttempt.aggregate([
        { $match: { completed: true } },
        { $group: { _id: null, avg: { $avg: '$total_score' } } },
      ]),
      ExamAttempt.aggregate([
        { $match: { completed: true } },
        {
          $group: {
            _id: '$exam_id',
            totalAttempts: { $sum: 1 },
            avgScore: { $avg: '$total_score' },
            maxScore: { $max: '$total_score' },
            minScore: { $min: '$total_score' },
          },
        },
        {
          $lookup: {
            from: 'exams',
            localField: '_id',
            foreignField: '_id',
            as: 'exam',
          },
        },
        { $unwind: { path: '$exam', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            examName: '$exam.exam_name',
            totalAttempts: 1,
            avgScore: { $round: ['$avgScore', 2] },
            maxScore: 1,
            minScore: 1,
          },
        },
        { $sort: { totalAttempts: -1 } },
      ]),
      ExamAttempt.aggregate([
        { $match: { completed: true } },
        {
          $group: {
            _id: '$student_id',
            totalAttempts: { $sum: 1 },
            avgScore: { $avg: '$total_score' },
            totalScore: { $sum: '$total_score' },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'student',
          },
        },
        { $unwind: { path: '$student', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            studentName: { $concat: ['$student.full_name', ' (', '$student.email', ')'] },
            totalAttempts: 1,
            avgScore: { $round: ['$avgScore', 2] },
            totalScore: 1,
          },
        },
        { $sort: { avgScore: -1 } },
        { $limit: 10 },
      ]),
    ]);

    return res.json({
      overview: {
        totalAttempts,
        completedAttempts,
        pendingAttempts,
        averageScore: avgScore[0]?.avg ? avgScore[0].avg.toFixed(2) : 0,
      },
      examStats,
      topStudents: studentStats,
    });
  } catch (error) {
    console.error('Error fetching result stats:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/results/exam/:examId/report (Result Manager) - Get exam summary report
const getExamReport = async (req, res) => {
  const { examId } = req.params;
  try {
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const totalQuestions = await Question.countDocuments({ exam_id: examId });
    const attempts = await ExamAttempt.find({ exam_id: examId })
      .populate('student_id', 'username full_name email')
      .sort({ createdAt: -1 });

    const completedAttempts = attempts.filter((a) => a.completed);
    const ongoingAttempts = attempts.filter((a) => !a.completed);

    const stats = {
      totalStudents: attempts.length,
      completed: completedAttempts.length,
      ongoing: ongoingAttempts.length,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      passCount: 0,
      failCount: 0,
    };

    if (completedAttempts.length > 0) {
      const scores = completedAttempts.map((a) => a.total_score);
      stats.averageScore = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2);
      stats.highestScore = Math.max(...scores);
      stats.lowestScore = Math.min(...scores);
      const passThreshold = totalQuestions / 2;
      stats.passCount = scores.filter((s) => s >= passThreshold).length;
      stats.failCount = scores.filter((s) => s < passThreshold).length;
    }

    return res.json({
      exam: {
        exam_name: exam.exam_name,
        start_time: exam.start_time,
        end_time: exam.end_time,
        duration: exam.duration,
        is_active: exam.is_active,
      },
      questions: {
        total: totalQuestions,
      },
      attempts: {
        all: attempts,
        completed: completedAttempts,
        ongoing: ongoingAttempts,
      },
      statistics: stats,
    });
  } catch (error) {
    console.error('Error fetching exam report:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllResults,
  getResultsByExam,
  getMyResults,
  getResultsByStudent,
  getAttemptDetails,
  getResultStats,
  getExamReport,
  getMyAttemptDetails,
};


