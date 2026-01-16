const express = require('express');
const { getAllExams, getAllResults, getSystemStats } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All admin routes require System Admin role
router.use(protect, authorize('System Admin'));

router.get('/exams', getAllExams);
router.get('/results', getAllResults);
router.get('/stats', getSystemStats);

module.exports = router;
