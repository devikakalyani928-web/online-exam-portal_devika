const Feedback = require('../models/Feedback');
const User = require('../models/User');

// POST /api/feedback - Student submits feedback
const submitFeedback = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const feedback = new Feedback({
      student_id: req.user._id,
      message: message.trim(),
      status: 'Pending',
    });

    await feedback.save();
    res.status(201).json({ message: 'Feedback submitted successfully', feedback });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/feedback/student/me - Student gets their feedback
const getMyFeedback = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ student_id: req.user._id })
      .sort({ createdAt: -1 });

    res.json(feedbacks);
  } catch (error) {
    console.error('Error fetching student feedback:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/feedback - Admin gets all feedback
const getAllFeedback = async (req, res) => {
  try {
    const feedbacks = await Feedback.find()
      .populate('student_id', 'username full_name email')
      .sort({ createdAt: -1 });

    // Filter out feedbacks where student was deleted
    const validFeedbacks = feedbacks.filter(feedback => feedback.student_id !== null);

    res.json(validFeedbacks);
  } catch (error) {
    console.error('Error fetching all feedback:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/feedback/:id/reply - Admin replies to feedback
const replyToFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { reply } = req.body;

    if (!reply || !reply.trim()) {
      return res.status(400).json({ message: 'Reply message is required' });
    }

    const feedback = await Feedback.findById(id);

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    feedback.reply = reply.trim();
    feedback.status = 'Replied';
    await feedback.save();

    res.json({ message: 'Reply sent successfully', feedback });
  } catch (error) {
    console.error('Error replying to feedback:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  submitFeedback,
  getMyFeedback,
  getAllFeedback,
  replyToFeedback,
};
