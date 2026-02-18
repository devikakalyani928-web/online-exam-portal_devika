const mongoose = require('mongoose');

const studentAnswerSchema = new mongoose.Schema(
  {
    attempt_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ExamAttempt', required: true },
    question_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    selected_option: { 
      type: Number, 
      required: false,
      default: null,
      validate: {
        validator: function(value) {
          // Allow null/undefined or values 1, 2, 3, 4
          return value === null || value === undefined || [1, 2, 3, 4].includes(value);
        },
        message: 'Selected option must be 1, 2, 3, 4, or null'
      }
    },
    is_correct: { type: Boolean, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StudentAnswer', studentAnswerSchema);


