require('dotenv').config();
const mongoose = require('mongoose');
const Class = require('./models/Class');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_study_db';
console.log('MongoDB URI:', MONGODB_URI);

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected successfully');
    
    try {
      // Find all classes
      const classes = await Class.find({});
      console.log('Classes found:', classes.length);
      console.log('Classes data:', JSON.stringify(classes, null, 2));
      
      // Check if there are any classes
      if (classes.length === 0) {
        console.log('No classes found in the database');
      }
    } catch (error) {
      console.error('Error querying classes:', error);
    } finally {
      // Close the connection
      mongoose.connection.close();
      console.log('MongoDB connection closed');
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });
