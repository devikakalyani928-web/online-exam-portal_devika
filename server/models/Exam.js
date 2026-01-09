const mongoose = require('mongoose');

const examSchema = new mongoose.Schema(
  {
    exam_name: { type: String, required: true, trim: true },
    start_time: { type: Date, required: true },
    end_time: { type: Date, required: true },
    duration: { type: Number, required: true }, // minutes
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    is_active: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Exam', examSchema);


