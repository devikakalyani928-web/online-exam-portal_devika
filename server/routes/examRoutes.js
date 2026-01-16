const express = require('express');
const { body } = require('express-validator');
const {
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
} = require('../controllers/examController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Exam Manager, Question Manager, and Result Manager routes (all need to view exams)
router.get('/', protect, authorize('Exam Manager', 'Question Manager', 'Result Manager'), getExams);

router.post(
  '/',
  protect,
  authorize('Exam Manager'),
  [
    body('exam_name').notEmpty().withMessage('Exam name is required'),
    body('start_time').notEmpty().withMessage('Start time is required'),
    body('end_time').notEmpty().withMessage('End time is required'),
    body('duration').isInt({ min: 1 }).withMessage('Duration (minutes) is required'),
  ],
  createExam
);

router.get('/:id/details', protect, authorize('Exam Manager'), getExamDetails);
router.get('/:id/attempts', protect, authorize('Exam Manager'), getExamAttempts);
router.get('/:id/ongoing', protect, authorize('Exam Manager'), getOngoingAttempts);
router.put('/:id', protect, authorize('Exam Manager'), updateExam);
router.post('/:id/activate', protect, authorize('Exam Manager'), activateExam);
router.post('/:id/deactivate', protect, authorize('Exam Manager'), deactivateExam);

// Student routes
router.get('/available', protect, authorize('Student'), getAvailableExams);
router.get('/:id/questions', protect, authorize('Student'), getExamQuestionsForStudent);
router.post('/:id/start', protect, authorize('Student'), startExam);
router.post('/:id/submit', protect, authorize('Student'), submitExam);

module.exports = router;


