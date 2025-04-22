require('dotenv').config();
const mongoose = require('mongoose');
const StudySlot = require('./models/StudySlot');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_study_db';
console.log('MongoDB URI:', MONGODB_URI);

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected successfully');
    
    try {
      // Find all study slots
      const studySlots = await StudySlot.find({});
      console.log('Study slots found:', studySlots.length);
      console.log('Study slots data:', JSON.stringify(studySlots, null, 2));
      
      // Check if there are any study slots
      if (studySlots.length === 0) {
        console.log('No study slots found in the database');
      }
    } catch (error) {
      console.error('Error querying study slots:', error);
    } finally {
      // Close the connection
      mongoose.connection.close();
      console.log('MongoDB connection closed');
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });
