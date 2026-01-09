const express = require('express');
const { getAllResults, getResultsByExam, getMyResults } = require('../controllers/resultController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Result Manager
router.get('/', protect, authorize('Result Manager'), getAllResults);
router.get('/:examId', protect, authorize('Result Manager'), getResultsByExam);

// Student
router.get('/student/me', protect, authorize('Student'), getMyResults);

module.exports = router;


