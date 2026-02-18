const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true, trim: true },
    reply: { type: String, trim: true, default: null },
    status: { 
      type: String, 
      enum: ['Pending', 'Replied'], 
      default: 'Pending' 
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Feedback', feedbackSchema);
