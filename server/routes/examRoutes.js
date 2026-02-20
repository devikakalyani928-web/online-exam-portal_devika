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
  deleteExam,
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
    body('exam_name')
      .notEmpty().withMessage('Exam name is required')
      .matches(/^[a-zA-Z\s]+$/).withMessage('Exam name must contain only letters (no numbers or special characters)'),
    body('start_time')
      .notEmpty().withMessage('Start time is required')
      .custom((value) => {
        const startDate = new Date(value);
        const now = new Date();
        // Compare only the date portion (year, month, day)
        const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (startDateOnly < todayOnly) {
          throw new Error('Start date cannot be before today');
        }
        return true;
      }),
    body('end_time')
      .notEmpty().withMessage('End time is required')
      .custom((value, { req }) => {
        if (req.body.start_time) {
          const startTime = new Date(req.body.start_time);
          const endTime = new Date(value);
          if (endTime <= startTime) {
            throw new Error('End time must be greater than start time');
          }
        }
        return true;
      }),
    body('duration').isInt({ min: 1 }).withMessage('Duration (minutes) is required'),
  ],
  createExam
);

router.get('/:id/details', protect, authorize('Exam Manager'), getExamDetails);
router.get('/:id/attempts', protect, authorize('Exam Manager'), getExamAttempts);
router.get('/:id/ongoing', protect, authorize('Exam Manager'), getOngoingAttempts);
router.put(
  '/:id',
  protect,
  authorize('Exam Manager'),
  [
    body('exam_name')
      .optional({ checkFalsy: true })
      .matches(/^[a-zA-Z\s]+$/).withMessage('Exam name must contain only letters (no numbers or special characters)'),
    body('start_time')
      .optional({ checkFalsy: true })
      .custom((value) => {
        const startDate = new Date(value);
        const now = new Date();
        // Compare only the date portion (year, month, day)
        const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (startDateOnly < todayOnly) {
          throw new Error('Start date cannot be before today');
        }
        return true;
      }),
    body('end_time')
      .optional({ checkFalsy: true })
      .custom((value, { req }) => {
        // If start_time is being updated, validate against it
        if (req.body.start_time) {
          const startTime = new Date(req.body.start_time);
          const endTime = new Date(value);
          if (endTime <= startTime) {
            throw new Error('End time must be greater than start time');
          }
        }
        // If only end_time is being updated, validation against existing start_time
        // will be handled in the controller if needed
        return true;
      }),
    body('duration')
      .optional({ checkFalsy: true })
      .isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
  ],
  updateExam
);
router.post('/:id/activate', protect, authorize('Exam Manager'), activateExam);
router.post('/:id/deactivate', protect, authorize('Exam Manager'), deactivateExam);
router.delete('/:id', protect, authorize('Exam Manager'), deleteExam);

// Student routes
router.get('/available', protect, authorize('Student'), getAvailableExams);
router.get('/:id/questions', protect, authorize('Student'), getExamQuestionsForStudent);
router.post('/:id/start', protect, authorize('Student'), startExam);
router.post('/:id/submit', protect, authorize('Student'), submitExam);

module.exports = router;


