const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    exam_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    question_text: { type: String, required: true, trim: true },
    option1: { type: String, required: true },
    option2: { type: String, required: true },
    option3: { type: String, required: true },
    option4: { type: String, required: true },
    correct_option: { type: Number, enum: [1, 2, 3, 4], required: true },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Question', questionSchema);


