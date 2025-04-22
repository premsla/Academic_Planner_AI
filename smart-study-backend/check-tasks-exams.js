require('dotenv').config();
const mongoose = require('mongoose');
const Task = require('./models/Task');
const Exam = require('./models/Exam');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_study_db';
console.log('MongoDB URI:', MONGODB_URI);

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected successfully');
    
    try {
      // Find all tasks
      const tasks = await Task.find({});
      console.log('Tasks found:', tasks.length);
      console.log('Tasks data:', JSON.stringify(tasks, null, 2));
      
      // Find all exams
      const exams = await Exam.find({});
      console.log('Exams found:', exams.length);
      console.log('Exams data:', JSON.stringify(exams, null, 2));
      
      // Check if there are any tasks or exams
      if (tasks.length === 0 && exams.length === 0) {
        console.log('No tasks or exams found in the database');
      }
    } catch (error) {
      console.error('Error querying tasks and exams:', error);
    } finally {
      // Close the connection
      mongoose.connection.close();
      console.log('MongoDB connection closed');
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });
