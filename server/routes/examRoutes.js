const express = require('express');
const { body } = require('express-validator');
const {
  createExam,
  getExams,
  updateExam,
  activateExam,
  deactivateExam,
} = require('../controllers/examController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All exam management routes are for Exam Manager
router.use(protect, authorize('Exam Manager'));

router.get('/', getExams);

router.post(
  '/',
  [
    body('exam_name').notEmpty().withMessage('Exam name is required'),
    body('start_time').notEmpty().withMessage('Start time is required'),
    body('end_time').notEmpty().withMessage('End time is required'),
    body('duration').isInt({ min: 1 }).withMessage('Duration (minutes) is required'),
  ],
  createExam
);

router.put('/:id', updateExam);
router.post('/:id/activate', activateExam);
router.post('/:id/deactivate', deactivateExam);

module.exports = router;


