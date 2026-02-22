const { validationResult } = require('express-validator');
const Question = require('../models/Question');
const StudentAnswer = require('../models/StudentAnswer');
const ExamAttempt = require('../models/ExamAttempt');

// POST /api/questions
const createQuestion = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { exam_id, question_text, option1, option2, option3, option4, correct_option } = req.body;

  try {
    const question = await Question.create({
      exam_id,
      question_text,
      option1,
      option2,
      option3,
      option4,
      correct_option,
      created_by: req.user._id,
    });
    return res.status(201).json(question);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/questions/:examId
const getQuestionsByExam = async (req, res) => {
  const { examId } = req.params;
  try {
    // Filter questions to only show those created by the logged-in user for this exam
    const questions = await Question.find({ 
      exam_id: examId,
      created_by: req.user._id 
    });
    return res.json(questions);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/questions/:id
const updateQuestion = async (req, res) => {
  const { id } = req.params;
  const { question_text, option1, option2, option3, option4, correct_option } = req.body;

  try {
    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    // Verify that the question was created by the logged-in user
    if (String(question.created_by) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Access denied. You can only update questions you created.' });
    }

    if (question_text !== undefined) question.question_text = question_text;
    if (option1 !== undefined) question.option1 = option1;
    if (option2 !== undefined) question.option2 = option2;
    if (option3 !== undefined) question.option3 = option3;
    if (option4 !== undefined) question.option4 = option4;
    if (correct_option !== undefined) question.correct_option = correct_option;

    await question.save();
    return res.json(question);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/questions/:id
const deleteQuestion = async (req, res) => {
  const { id } = req.params;
  try {
    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    // Verify that the question was created by the logged-in user
    if (String(question.created_by) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Access denied. You can only delete questions you created.' });
    }

    // Find all student answers associated with this question
    const answers = await StudentAnswer.find({ question_id: id });
    const attemptIds = [...new Set(answers.map(answer => String(answer.attempt_id)))];

    // Delete all student answers for this question
    const deleteAnswersResult = await StudentAnswer.deleteMany({ question_id: id });

    // Recalculate scores for affected exam attempts
    if (attemptIds.length > 0) {
      for (const attemptId of attemptIds) {
        const attempt = await ExamAttempt.findById(attemptId);
        if (attempt && attempt.completed) {
          // Recalculate score based on remaining valid answers
          const remainingAnswers = await StudentAnswer.find({ 
            attempt_id: attemptId,
            is_correct: true 
          });
          attempt.total_score = remainingAnswers.length;
          await attempt.save();
        }
      }
    }

    await question.deleteOne();
    return res.json({ 
      message: 'Question deleted',
      deletedAnswersCount: deleteAnswersResult.deletedCount,
      affectedAttemptsCount: attemptIds.length,
    });
  } catch (error) {
    console.error('Error deleting question:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/questions (Question Manager) - Get all questions across all exams
const getAllQuestions = async (req, res) => {
  try {
    // Filter questions to only show those created by the logged-in user
    const questions = await Question.find({ created_by: req.user._id })
      .populate('exam_id', 'exam_name start_time end_time')
      .populate('created_by', 'username full_name')
      .sort({ createdAt: -1 });
    return res.json(questions);
  } catch (error) {
    console.error('Error fetching all questions:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/questions/stats (Question Manager) - Get question bank statistics
const getQuestionStats = async (req, res) => {
  try {
    // Filter stats to only include questions created by the logged-in user
    const totalQuestions = await Question.countDocuments({ created_by: req.user._id });
    const questionsByExam = await Question.aggregate([
      {
        $match: { created_by: req.user._id }
      },
      {
        $group: {
          _id: '$exam_id',
          count: { $sum: 1 },
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
      {
        $unwind: { path: '$exam', preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          examName: '$exam.exam_name',
          count: 1,
        },
      },
      { $sort: { count: -1 } },
    ]);

    return res.json({
      totalQuestions,
      questionsByExam,
    });
  } catch (error) {
    console.error('Error fetching question stats:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/questions/check-duplicate (Question Manager) - Check for duplicate questions
const checkDuplicate = async (req, res) => {
  const { question_text, exam_id, exclude_id } = req.body;
  
  try {
    // Only check for duplicates within questions created by the logged-in user
    const query = {
      question_text: { $regex: new RegExp(`^${question_text.trim()}$`, 'i') },
      created_by: req.user._id,
    };
    
    if (exam_id) {
      query.exam_id = exam_id;
    }
    
    if (exclude_id) {
      query._id = { $ne: exclude_id };
    }
    
    const duplicate = await Question.findOne(query);
    
    return res.json({
      isDuplicate: !!duplicate,
      duplicateQuestion: duplicate,
    });
  } catch (error) {
    console.error('Error checking duplicate:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createQuestion,
  getQuestionsByExam,
  updateQuestion,
  deleteQuestion,
  getAllQuestions,
  getQuestionStats,
  checkDuplicate,
};


