const ExamAttempt = require('../models/ExamAttempt');
const Exam = require('../models/Exam');

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
      .populate('exam_id', 'exam_name')
      .sort({ createdAt: -1 });
    return res.json(attempts);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getAllResults, getResultsByExam, getMyResults };


