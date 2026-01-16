const { validationResult } = require('express-validator');
const Question = require('../models/Question');

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
    const questions = await Question.find({ exam_id: examId });
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
    await question.deleteOne();
    return res.json({ message: 'Question deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/questions (Question Manager) - Get all questions across all exams
const getAllQuestions = async (req, res) => {
  try {
    const questions = await Question.find()
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
    const totalQuestions = await Question.countDocuments();
    const questionsByExam = await Question.aggregate([
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
    const query = {
      question_text: { $regex: new RegExp(`^${question_text.trim()}$`, 'i') },
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


