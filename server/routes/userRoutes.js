const express = require('express');
const { body } = require('express-validator');
const { getUsers, createUser, updateUser, deleteUser } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes here require System Admin
router.use(protect, authorize('System Admin'));

router.get('/', getUsers);

router.post(
  '/',
  [
    body('username').notEmpty().withMessage('Username is required'),
    body('full_name').notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role')
      .isIn(['System Admin', 'Exam Manager', 'Question Manager', 'Result Manager', 'Student'])
      .withMessage('Invalid role'),
  ],
  createUser
);

router.put('/:id', updateUser);

router.delete('/:id', deleteUser);

module.exports = router;


