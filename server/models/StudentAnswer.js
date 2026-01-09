const mongoose = require('mongoose');

const studentAnswerSchema = new mongoose.Schema(
  {
    attempt_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ExamAttempt', required: true },
    question_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    selected_option: { type: Number, enum: [1, 2, 3, 4], required: true },
    is_correct: { type: Boolean, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StudentAnswer', studentAnswerSchema);


