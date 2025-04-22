require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_study_db';
console.log('MongoDB URI:', MONGODB_URI);

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected successfully');
    
    try {
      // Find all users
      const users = await User.find({}).select('-password'); // Exclude password for security
      console.log('Users found:', users.length);
      console.log('Users data:', JSON.stringify(users, null, 2));
      
      // Check if there are any users
      if (users.length === 0) {
        console.log('No users found in the database');
      }
    } catch (error) {
      console.error('Error querying users:', error);
    } finally {
      // Close the connection
      mongoose.connection.close();
      console.log('MongoDB connection closed');
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });
