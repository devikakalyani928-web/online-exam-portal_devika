const { validationResult } = require('express-validator');
const User = require('../models/User');

// GET /api/users
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/users
const createUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, full_name, email, password, role } = req.body;

  try {
    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) {
      return res.status(400).json({ message: 'User with that email or username already exists' });
    }

    const user = await User.create({ username, full_name, email, password, role });

    return res.status(201).json({
      _id: user._id,
      username: user.username,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/users/:id
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, full_name, email, role } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (username !== undefined) user.username = username;
    if (full_name !== undefined) user.full_name = full_name;
    if (email !== undefined) user.email = email;
    if (role !== undefined) user.role = role;

    await user.save();

    return res.json({
      _id: user._id,
      username: user.username,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/users/:id
const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.deleteOne();
    return res.json({ message: 'User deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getUsers, createUser, updateUser, deleteUser };


