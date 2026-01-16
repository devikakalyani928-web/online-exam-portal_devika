const { validationResult } = require('express-validator');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const ExamAttempt = require('../models/ExamAttempt');
const StudentAnswer = require('../models/StudentAnswer');

// POST /api/exams
const createExam = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { exam_name, start_time, end_time, duration } = req.body;

  try {
    const exam = await Exam.create({
      exam_name,
      start_time,
      end_time,
      duration,
      created_by: req.user._id,
    });
    return res.status(201).json(exam);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/exams
const getExams = async (req, res) => {
  try {
    const exams = await Exam.find().populate('created_by', 'username full_name role');
    return res.json(exams);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/exams/:id
const updateExam = async (req, res) => {
  const { id } = req.params;
  const { exam_name, start_time, end_time, duration } = req.body;

  try {
    const exam = await Exam.findById(id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    if (exam_name !== undefined) exam.exam_name = exam_name;
    if (start_time !== undefined) exam.start_time = start_time;
    if (end_time !== undefined) exam.end_time = end_time;
    if (duration !== undefined) exam.duration = duration;

    await exam.save();
    return res.json(exam);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/exams/:id/activate
const activateExam = async (req, res) => {
  const { id } = req.params;
  try {
    const exam = await Exam.findById(id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    exam.is_active = true;
    await exam.save();
    return res.json(exam);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/exams/:id/deactivate
const deactivateExam = async (req, res) => {
  const { id } = req.params;
  try {
    const exam = await Exam.findById(id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    exam.is_active = false;
    await exam.save();
    return res.json(exam);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/exams/available (Student)
const getAvailableExams = async (req, res) => {
  try {
    const now = new Date();
    const exams = await Exam.find({
      is_active: true,
      start_time: { $lte: now },
      end_time: { $gte: now },
    }).sort({ start_time: 1 });

    // Check which exams the student has already attempted
    const examIds = exams.map((e) => e._id);
    const attempts = await ExamAttempt.find({
      exam_id: { $in: examIds },
      student_id: req.user._id,
    });

    const attemptedExamIds = new Set(attempts.map((a) => String(a.exam_id)));

    const examsWithStatus = exams.map((exam) => ({
      ...exam.toObject(),
      attempted: attemptedExamIds.has(String(exam._id)),
      attemptId: attempts.find((a) => String(a.exam_id) === String(exam._id))?._id,
    }));

    return res.json(examsWithStatus);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/exams/:id/questions (Student, without correct_option)
const getExamQuestionsForStudent = async (req, res) => {
  const { id } = req.params;
  try {
    const questions = await Question.find({ exam_id: id }).select(
      'question_text option1 option2 option3 option4'
    );
    return res.json(questions);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/exams/:id/start (Student)
const startExam = async (req, res) => {
  const { id } = req.params;

  try {
    const exam = await Exam.findById(id);
    if (!exam || !exam.is_active) {
      return res.status(400).json({ message: 'Exam not available' });
    }

    const existing = await ExamAttempt.findOne({
      exam_id: id,
      student_id: req.user._id,
    });
    if (existing) {
      return res.status(400).json({ message: 'You have already attempted this exam' });
    }

    const attempt = await ExamAttempt.create({
      exam_id: id,
      student_id: req.user._id,
      start_time: new Date(),
    });

    return res.status(201).json(attempt);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/exams/:id/submit (Student)
// Body: { answers: [{ question_id, selected_option }] }
const submitExam = async (req, res) => {
  const { id } = req.params;
  const { answers } = req.body;

  if (!Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ message: 'Answers are required' });
  }

  try {
    const attempt = await ExamAttempt.findOne({
      exam_id: id,
      student_id: req.user._id,
    });

    if (!attempt) {
      return res.status(400).json({ message: 'Exam not started' });
    }

    if (attempt.completed) {
      return res.status(400).json({ message: 'Exam already submitted' });
    }

    const questionIds = answers.map((a) => a.question_id);
    const questions = await Question.find({ _id: { $in: questionIds }, exam_id: id });
    const questionMap = new Map();
    questions.forEach((q) => {
      questionMap.set(String(q._id), q);
    });

    let score = 0;
    const answerDocs = [];

    answers.forEach((ans) => {
      const q = questionMap.get(String(ans.question_id));
      if (!q) return;
      const isCorrect = q.correct_option === ans.selected_option;
      if (isCorrect) score += 1;
      answerDocs.push({
        attempt_id: attempt._id,
        question_id: q._id,
        selected_option: ans.selected_option,
        is_correct: isCorrect,
      });
    });

    if (answerDocs.length > 0) {
      await StudentAnswer.insertMany(answerDocs);
    }

    attempt.total_score = score;
    attempt.completed = true;
    attempt.end_time = new Date();
    await attempt.save();

    return res.json({
      message: 'Exam submitted',
      total_score: score,
      total_questions: questions.length,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/exams/:id/details (Exam Manager) - Get exam details with stats
const getExamDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const exam = await Exam.findById(id).populate('created_by', 'username full_name email');
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Get questions count
    const questionsCount = await Question.countDocuments({ exam_id: id });

    // Get attempts stats
    const attemptsStats = await ExamAttempt.aggregate([
      { $match: { exam_id: exam._id } },
      {
        $group: {
          _id: null,
          totalAttempts: { $sum: 1 },
          completedAttempts: { $sum: { $cond: ['$completed', 1, 0] } },
          ongoingAttempts: { $sum: { $cond: [{ $eq: ['$completed', false] }, 1, 0] } },
          avgScore: { $avg: { $cond: ['$completed', '$total_score', null] } },
        },
      },
    ]);

    const stats = attemptsStats[0] || {
      totalAttempts: 0,
      completedAttempts: 0,
      ongoingAttempts: 0,
      avgScore: 0,
    };

    return res.json({
      exam,
      questionsCount,
      attempts: {
        total: stats.totalAttempts,
        completed: stats.completedAttempts,
        ongoing: stats.ongoingAttempts,
        averageScore: stats.avgScore ? stats.avgScore.toFixed(2) : 0,
      },
    });
  } catch (error) {
    console.error('Error fetching exam details:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/exams/:id/attempts (Exam Manager) - Get all attempts for an exam
const getExamAttempts = async (req, res) => {
  const { id } = req.params;
  try {
    const attempts = await ExamAttempt.find({ exam_id: id })
      .populate('student_id', 'username full_name email')
      .sort({ createdAt: -1 });
    return res.json(attempts);
  } catch (error) {
    console.error('Error fetching exam attempts:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/exams/:id/ongoing (Exam Manager) - Get ongoing attempts
const getOngoingAttempts = async (req, res) => {
  const { id } = req.params;
  try {
    const ongoingAttempts = await ExamAttempt.find({
      exam_id: id,
      completed: false,
    })
      .populate('student_id', 'username full_name email')
      .sort({ start_time: -1 });

    return res.json(ongoingAttempts);
  } catch (error) {
    console.error('Error fetching ongoing attempts:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createExam,
  getExams,
  updateExam,
  activateExam,
  deactivateExam,
  getAvailableExams,
  getExamQuestionsForStudent,
  startExam,
  submitExam,
  getExamDetails,
  getExamAttempts,
  getOngoingAttempts,
};


