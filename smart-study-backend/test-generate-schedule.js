require('dotenv').config();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const axios = require('axios');
const User = require('./models/User');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_study_db';
console.log('MongoDB URI:', MONGODB_URI);

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected successfully');
    
    try {
      // Find a user
      const user = await User.findOne({});
      
      if (!user) {
        console.error('No user found in the database');
        return;
      }
      
      console.log('Found user:', user._id.toString());
      
      // Generate a JWT token for the user
      const token = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '1h' });
      console.log('Generated token:', token);
      
      // Make a request to the generate smart schedule endpoint
      const response = await axios.post('http://localhost:5000/api/smart-schedule/generate', 
        { days: 7 },
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      console.log('Response status:', response.status);
      console.log('Response data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.error('Error:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
    } finally {
      // Close the connection
      mongoose.connection.close();
      console.log('MongoDB connection closed');
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });
