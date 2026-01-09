const { validationResult } = require('express-validator');
const Exam = require('../models/Exam');

// POST /api/exams
const createExam = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { exam_name, start_time, end_time, duration } = req.body;

  try {
    const exam = await Exam.create({
      exam_name,
      start_time,
      end_time,
      duration,
      created_by: req.user._id,
    });
    return res.status(201).json(exam);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/exams
const getExams = async (req, res) => {
  try {
    const exams = await Exam.find().populate('created_by', 'username full_name role');
    return res.json(exams);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/exams/:id
const updateExam = async (req, res) => {
  const { id } = req.params;
  const { exam_name, start_time, end_time, duration } = req.body;

  try {
    const exam = await Exam.findById(id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    if (exam_name !== undefined) exam.exam_name = exam_name;
    if (start_time !== undefined) exam.start_time = start_time;
    if (end_time !== undefined) exam.end_time = end_time;
    if (duration !== undefined) exam.duration = duration;

    await exam.save();
    return res.json(exam);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/exams/:id/activate
const activateExam = async (req, res) => {
  const { id } = req.params;
  try {
    const exam = await Exam.findById(id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    exam.is_active = true;
    await exam.save();
    return res.json(exam);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/exams/:id/deactivate
const deactivateExam = async (req, res) => {
  const { id } = req.params;
  try {
    const exam = await Exam.findById(id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    exam.is_active = false;
    await exam.save();
    return res.json(exam);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createExam, getExams, updateExam, activateExam, deactivateExam };


