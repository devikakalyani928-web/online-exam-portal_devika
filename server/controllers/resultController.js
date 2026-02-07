const ExamAttempt = require('../models/ExamAttempt');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const StudentAnswer = require('../models/StudentAnswer');
const User = require('../models/User');

// Utility function to clean up orphaned StudentAnswer records (answers with deleted questions)
const cleanupOrphanedAnswers = async () => {
  try {
    // Get all valid question IDs
    const validQuestionIds = await Question.find().distinct('_id');
    
    // Find all StudentAnswer records with invalid question_id
    const orphanedAnswers = await StudentAnswer.find({
      question_id: { $nin: validQuestionIds }
    });
    
    if (orphanedAnswers.length === 0) {
      return { deletedCount: 0, affectedAttempts: [] };
    }
    
    // Get unique attempt IDs that will be affected
    const attemptIds = [...new Set(orphanedAnswers.map(answer => String(answer.attempt_id)))];
    
    // Delete orphaned answers
    const deleteResult = await StudentAnswer.deleteMany({
      question_id: { $nin: validQuestionIds }
    });
    
    // Recalculate scores for affected completed attempts
    const affectedAttempts = [];
    for (const attemptId of attemptIds) {
      const attempt = await ExamAttempt.findById(attemptId);
      if (attempt && attempt.completed) {
        // Recalculate score based on remaining valid answers
        const remainingAnswers = await StudentAnswer.find({ 
          attempt_id: attemptId,
          is_correct: true 
        });
        const newScore = remainingAnswers.length;
        if (attempt.total_score !== newScore) {
          attempt.total_score = newScore;
          await attempt.save();
          affectedAttempts.push(attemptId);
        }
      }
    }
    
    return {
      deletedCount: deleteResult.deletedCount,
      affectedAttempts: affectedAttempts.length
    };
  } catch (error) {
    console.error('Error cleaning up orphaned answers:', error);
    return { deletedCount: 0, affectedAttempts: 0, error: error.message };
  }
};

// GET /api/results (Result Manager)
const getAllResults = async (req, res) => {
  try {
    // Clean up orphaned answers (runs automatically to handle existing orphaned records)
    // This is safe to run on every request as it only processes orphaned records
    await cleanupOrphanedAnswers();
    
    const attempts = await ExamAttempt.find()
      .populate('exam_id', 'exam_name')
      .populate('student_id', 'username full_name email');
    
    // Filter out attempts where exam_id is null (exam was deleted)
    const validAttempts = attempts.filter(attempt => attempt.exam_id !== null);
    
    return res.json(validAttempts);
  } catch (error) {
    console.error('Error fetching all results:', error);
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
    
    // Filter out attempts where exam_id is null (exam was deleted)
    const validAttempts = attempts.filter(attempt => attempt.exam_id !== null);
    
    // Get question counts for each exam
    const Question = require('../models/Question');
    const examIds = [...new Set(validAttempts.map(a => a.exam_id?._id || a.exam_id).filter(Boolean))];
    const questionCounts = await Question.aggregate([
      { $match: { exam_id: { $in: examIds } } },
      { $group: { _id: '$exam_id', count: { $sum: 1 } } },
    ]);
    const questionCountMap = new Map();
    questionCounts.forEach((qc) => {
      questionCountMap.set(String(qc._id), qc.count);
    });

    // Add question count to each attempt
    const attemptsWithCounts = validAttempts.map((attempt) => {
      const examId = attempt.exam_id?._id || attempt.exam_id;
      const questionCount = questionCountMap.get(String(examId)) || 0;
      return {
        ...attempt.toObject(),
        exam_id: {
          ...(attempt.exam_id?.toObject ? attempt.exam_id.toObject() : attempt.exam_id),
          questionsCount: questionCount,
        },
      };
    });

    return res.json(attemptsWithCounts);
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

    // Filter out answers where question_id is null (question was deleted)
    const validAnswers = answers.filter(answer => answer.question_id !== null);

    return res.json({
      attempt,
      answers: validAnswers,
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
    
    // Filter out attempts where exam_id is null (exam was deleted)
    const validAttempts = attempts.filter(attempt => attempt.exam_id !== null);
    
    return res.json(validAttempts);
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

    // Filter out answers where question_id is null (question was deleted)
    const validAnswers = answers.filter(answer => answer.question_id !== null);

    return res.json({
      attempt,
      answers: validAnswers,
    });
  } catch (error) {
    console.error('Error fetching attempt details:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/results/stats (Result Manager) - Get result statistics
const getResultStats = async (req, res) => {
  try {
    // Get all valid exam IDs (exams that still exist)
    const validExamIds = await Exam.find().distinct('_id');
    
    const [
      totalAttempts,
      completedAttempts,
      pendingAttempts,
      avgScore,
      examStats,
      studentStats,
    ] = await Promise.all([
      ExamAttempt.countDocuments({ exam_id: { $in: validExamIds } }),
      ExamAttempt.countDocuments({ exam_id: { $in: validExamIds }, completed: true }),
      ExamAttempt.countDocuments({ exam_id: { $in: validExamIds }, completed: false }),
      ExamAttempt.aggregate([
        { $match: { exam_id: { $in: validExamIds }, completed: true } },
        { $group: { _id: null, avg: { $avg: '$total_score' } } },
      ]),
      ExamAttempt.aggregate([
        { $match: { exam_id: { $in: validExamIds }, completed: true } },
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
        { $unwind: { path: '$exam', preserveNullAndEmptyArrays: false } },
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
        { $match: { exam_id: { $in: validExamIds }, completed: true } },
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


