const mongoose = require('mongoose');

const examAttemptSchema = new mongoose.Schema(
  {
    exam_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    start_time: { type: Date, required: true, default: Date.now },
    end_time: { type: Date },
    total_score: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ExamAttempt', examAttemptSchema);


