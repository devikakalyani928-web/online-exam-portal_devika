const User = require('../models/User');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const ExamAttempt = require('../models/ExamAttempt');

// GET /api/admin/exams - View all examinations
const getAllExams = async (req, res) => {
  try {
    const exams = await Exam.find()
      .populate('created_by', 'username full_name email')
      .sort({ createdAt: -1 });
    return res.json(exams);
  } catch (error) {
    console.error('Error fetching exams:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/admin/results - View all results
const getAllResults = async (req, res) => {
  try {
    const attempts = await ExamAttempt.find()
      .populate('exam_id', 'exam_name start_time end_time duration')
      .populate('student_id', 'username full_name email')
      .sort({ createdAt: -1 });
    return res.json(attempts);
  } catch (error) {
    console.error('Error fetching results:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/admin/stats - System statistics
const getSystemStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalExams,
      totalQuestions,
      totalAttempts,
      completedAttempts,
      usersByRole,
      activeExams,
    ] = await Promise.all([
      User.countDocuments(),
      Exam.countDocuments(),
      Question.countDocuments(),
      ExamAttempt.countDocuments(),
      ExamAttempt.countDocuments({ completed: true }),
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Exam.countDocuments({ is_active: true }),
    ]);

    // Calculate average score
    const scoreData = await ExamAttempt.aggregate([
      { $match: { completed: true } },
      {
        $group: {
          _id: null,
          avgScore: { $avg: '$total_score' },
          maxScore: { $max: '$total_score' },
        },
      },
    ]);

    const stats = {
      users: {
        total: totalUsers,
        byRole: usersByRole.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
      },
      exams: {
        total: totalExams,
        active: activeExams,
        inactive: totalExams - activeExams,
      },
      questions: {
        total: totalQuestions,
      },
      attempts: {
        total: totalAttempts,
        completed: completedAttempts,
        pending: totalAttempts - completedAttempts,
      },
      performance: {
        averageScore: scoreData[0]?.avgScore || 0,
        maxScore: scoreData[0]?.maxScore || 0,
      },
    };

    return res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getAllExams, getAllResults, getSystemStats };
