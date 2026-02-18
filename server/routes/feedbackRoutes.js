const express = require('express');
const {
  submitFeedback,
  getMyFeedback,
  getAllFeedback,
  replyToFeedback,
} = require('../controllers/feedbackController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Student routes (must come before parameterized routes)
router.post('/', protect, authorize('Student'), submitFeedback);
router.get('/student/me', protect, authorize('Student'), getMyFeedback);

// Admin routes
router.get('/', protect, authorize('System Admin'), getAllFeedback);
router.post('/:id/reply', protect, authorize('System Admin'), replyToFeedback);

module.exports = router;
