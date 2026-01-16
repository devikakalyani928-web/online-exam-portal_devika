const express = require('express');
const {
  getAllResults,
  getResultsByExam,
  getMyResults,
  getResultsByStudent,
  getAttemptDetails,
  getResultStats,
  getExamReport,
  getMyAttemptDetails,
} = require('../controllers/resultController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Student routes (must come before parameterized routes)
router.get('/student/me', protect, authorize('Student'), getMyResults);
router.get('/student/me/:attemptId', protect, authorize('Student'), getMyAttemptDetails);

// Result Manager routes (specific routes first)
router.get('/stats', protect, authorize('Result Manager'), getResultStats);
router.get('/student/:studentId', protect, authorize('Result Manager'), getResultsByStudent);
router.get('/attempt/:attemptId/details', protect, authorize('Result Manager'), getAttemptDetails);
router.get('/exam/:examId/report', protect, authorize('Result Manager'), getExamReport);

// Result Manager routes (parameterized routes)
router.get('/', protect, authorize('Result Manager'), getAllResults);
router.get('/:examId', protect, authorize('Result Manager'), getResultsByExam);

module.exports = router;


