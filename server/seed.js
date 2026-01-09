const dotenv = require('dotenv');
const mongoose = require('mongoose');
const User = require('./models/User');
const Exam = require('./models/Exam');
const Question = require('./models/Question');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const seed = async () => {
  try {
    if (!MONGO_URI) {
      console.error('MONGO_URI is not set in .env');
      process.exit(1);
    }

    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected for seeding');

    // Clear existing data (safe for demo)
    await Promise.all([User.deleteMany({}), Exam.deleteMany({}), Question.deleteMany({})]);

    // Create users for each role
    const users = await User.insertMany([
      {
        username: 'sysadmin',
        full_name: 'System Admin',
        email: 'admin@example.com',
        password: 'Admin@123',
        role: 'System Admin',
      },
      {
        username: 'exammanager',
        full_name: 'Exam Manager',
        email: 'exam@example.com',
        password: 'Exam@123',
        role: 'Exam Manager',
      },
      {
        username: 'questionmanager',
        full_name: 'Question Manager',
        email: 'question@example.com',
        password: 'Question@123',
        role: 'Question Manager',
      },
      {
        username: 'resultmanager',
        full_name: 'Result Manager',
        email: 'result@example.com',
        password: 'Result@123',
        role: 'Result Manager',
      },
      {
        username: 'student1',
        full_name: 'Student One',
        email: 'student1@example.com',
        password: 'Student@123',
        role: 'Student',
      },
    ]);

    const examManager = users.find((u) => u.role === 'Exam Manager');

    // Create one sample exam
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    const exam = await Exam.create({
      exam_name: 'Sample Math Exam',
      start_time: now,
      end_time: oneHourLater,
      duration: 60,
      created_by: examManager._id,
      is_active: true,
    });

    // Create a few sample questions
    await Question.insertMany([
      {
        exam_id: exam._id,
        question_text: 'What is 2 + 2?',
        option1: '3',
        option2: '4',
        option3: '5',
        option4: '6',
        correct_option: 2,
        created_by: examManager._id,
      },
      {
        exam_id: exam._id,
        question_text: 'What is 5 * 3?',
        option1: '15',
        option2: '10',
        option3: '20',
        option4: '8',
        correct_option: 1,
        created_by: examManager._id,
      },
    ]);

    console.log('Seeding completed successfully.');
    console.log('Demo logins:');
    console.log('System Admin  -> admin@example.com / Admin@123');
    console.log('Exam Manager  -> exam@example.com / Exam@123');
    console.log('Question Mgr  -> question@example.com / Question@123');
    console.log('Result Mgr    -> result@example.com / Result@123');
    console.log('Student       -> student1@example.com / Student@123');

    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seed();


