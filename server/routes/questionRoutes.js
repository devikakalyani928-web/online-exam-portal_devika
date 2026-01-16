const express = require('express');
const { body } = require('express-validator');
const {
  createQuestion,
  getQuestionsByExam,
  updateQuestion,
  deleteQuestion,
  getAllQuestions,
  getQuestionStats,
  checkDuplicate,
} = require('../controllers/questionController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All question routes are for Question Manager
router.use(protect, authorize('Question Manager'));

router.post(
  '/',
  [
    body('exam_id').notEmpty().withMessage('Exam is required'),
    body('question_text').notEmpty().withMessage('Question text is required'),
    body('option1').notEmpty().withMessage('Option 1 is required'),
    body('option2').notEmpty().withMessage('Option 2 is required'),
    body('option3').notEmpty().withMessage('Option 3 is required'),
    body('option4').notEmpty().withMessage('Option 4 is required'),
    body('correct_option')
      .isInt({ min: 1, max: 4 })
      .withMessage('Correct option must be 1, 2, 3 or 4'),
  ],
  createQuestion
);

router.get('/all', getAllQuestions);
router.get('/stats', getQuestionStats);
router.post('/check-duplicate', checkDuplicate);

router.get('/:examId', getQuestionsByExam);

router.put('/:id', updateQuestion);

router.delete('/:id', deleteQuestion);

module.exports = router;


