require('dotenv').config();
const mongoose = require('mongoose');
const Task = require('./models/Task');
const Class = require('./models/Class');
const Exam = require('./models/Exam');
const StudySlot = require('./models/StudySlot');
const User = require('./models/User');
const llmService = require('./services/llmService');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_study_db';
console.log('MongoDB URI:', MONGODB_URI);

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected successfully');

    try {
      // Find a user
      const user = await User.findOne({ email: 'srinath@gmail.com' });

      if (!user) {
        console.error('No user found in the database');
        return;
      }

      const userId = user._id.toString();
      console.log('Found user:', userId);

      // Fetch student data
      const [tasks, classes, exams] = await Promise.all([
        Task.find({ userId, completed: { $ne: true } }),
        Class.find({ userId }),
        Exam.find({ userId })
      ]);

      console.log('Tasks found:', tasks.length);
      console.log('Classes found:', classes.length);
      console.log('Exams found:', exams.length);

      // Generate fallback schedule
      const fallbackSchedule = llmService.generateFallbackSchedule({
        tasks,
        classes,
        exams,
        preferences: { userId },
        days: 7
      });

      console.log('Fallback schedule generated:', fallbackSchedule.length, 'study slots');
      console.log('First few study slots:', JSON.stringify(fallbackSchedule.slice(0, 3), null, 2));

      // Save the fallback schedule to the database
      const savedSlots = [];
      for (const slotData of fallbackSchedule) {
        const studySlotData = {
          userId,
          title: slotData.title,
          startTime: new Date(slotData.startTime),
          endTime: new Date(slotData.endTime),
          duration: slotData.duration,
          isAiGenerated: true,
          isConfirmed: false,
          priority: slotData.priority || 3,
          notes: slotData.notes || ''
        };

        // Add taskId only if it exists
        if (slotData.taskId) {
          studySlotData.taskId = slotData.taskId;
        }

        const studySlot = new StudySlot(studySlotData);

        await studySlot.save();
        savedSlots.push(studySlot);
      }

      console.log('Saved', savedSlots.length, 'study slots to the database');
    } catch (error) {
      console.error('Error:', error.message);
    } finally {
      // Close the connection
      mongoose.connection.close();
      console.log('MongoDB connection closed');
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });
