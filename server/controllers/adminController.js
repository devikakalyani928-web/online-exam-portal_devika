const User = require('../models/User');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const ExamAttempt = require('../models/ExamAttempt');
const StudentAnswer = require('../models/StudentAnswer');

// Utility function to clean up orphaned ExamAttempt records (attempts with deleted exams)
const cleanupOrphanedAttempts = async () => {
  try {
    // Get all valid exam IDs
    const validExamIds = await Exam.find().distinct('_id');
    
    // Find all ExamAttempt records with invalid exam_id
    const orphanedAttempts = await ExamAttempt.find({
      exam_id: { $nin: validExamIds }
    });
    
    if (orphanedAttempts.length === 0) {
      return { deletedAttemptsCount: 0, deletedAnswersCount: 0 };
    }
    
    // Get all attempt IDs that will be deleted
    const attemptIds = orphanedAttempts.map(attempt => attempt._id);
    
    // Delete all StudentAnswer records associated with these orphaned attempts
    const deleteAnswersResult = await StudentAnswer.deleteMany({
      attempt_id: { $in: attemptIds }
    });
    
    // Delete orphaned ExamAttempt records
    const deleteAttemptsResult = await ExamAttempt.deleteMany({
      exam_id: { $nin: validExamIds }
    });
    
    return {
      deletedAttemptsCount: deleteAttemptsResult.deletedCount,
      deletedAnswersCount: deleteAnswersResult.deletedCount,
    };
  } catch (error) {
    console.error('Error cleaning up orphaned attempts:', error);
    return { deletedAttemptsCount: 0, deletedAnswersCount: 0, error: error.message };
  }
};

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
    // Clean up orphaned attempts (runs automatically to handle existing orphaned records)
    // This is safe to run on every request as it only processes orphaned records
    await cleanupOrphanedAttempts();
    
    const attempts = await ExamAttempt.find()
      .populate('exam_id', 'exam_name start_time end_time duration')
      .populate('student_id', 'username full_name email')
      .sort({ createdAt: -1 });
    
    // Filter out attempts where exam_id is null (exam was deleted)
    const validAttempts = attempts.filter(attempt => attempt.exam_id !== null);
    
    return res.json(validAttempts);
  } catch (error) {
    console.error('Error fetching results:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/admin/stats - System statistics
const getSystemStats = async (req, res) => {
  try {
    // Get all valid exam IDs to filter out orphaned attempts
    const validExamIds = await Exam.find().distinct('_id');
    
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
      ExamAttempt.countDocuments({ exam_id: { $in: validExamIds } }),
      ExamAttempt.countDocuments({ exam_id: { $in: validExamIds }, completed: true }),
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Exam.countDocuments({ is_active: true }),
    ]);

    // Calculate average score (only for valid attempts)
    const scoreData = await ExamAttempt.aggregate([
      { $match: { exam_id: { $in: validExamIds }, completed: true } },
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
