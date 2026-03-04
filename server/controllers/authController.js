const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key-change-in-production', { expiresIn: '7d' });

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  return null;
};

// POST /api/auth/register
const register = async (req, res) => {
  const validationError = handleValidation(req, res);
  if (validationError) return;

  const { username, full_name, email, password, role } = req.body;

  try {
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Validate role if provided
    const validRoles = ['System Admin', 'Exam Manager', 'Question Manager', 'Result Manager', 'Student'];
    const userRole = role || 'Student';
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ message: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }

    const user = await User.create({
      username,
      full_name,
      email,
      password,
      role: userRole,
    });

    return res.status(201).json({
      _id: user._id,
      username: user.username,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Registration error:', error);
    // Return more specific error messages
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    if (error.code === 11000) {
      // Duplicate key error
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ message: `${field} already exists` });
    }
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

// POST /api/auth/login
// Allows login using either email or username (identifier)
const login = async (req, res) => {
  const validationError = handleValidation(req, res);
  if (validationError) return;

  const { identifier, password } = req.body;

  try {
    const trimmed = identifier.trim();

    // Determine whether identifier is an email or username
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);

    const query = isEmail
      ? { email: trimmed.toLowerCase() }
      : { username: trimmed }; // exact username match

    const user = await User.findOne(query);

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    return res.json({
      _id: user._id,
      username: user.username,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { register, login, getMe };

