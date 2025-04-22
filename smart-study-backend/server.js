require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');
const classRoutes = require('./routes/classRoutes');
const examRoutes = require('./routes/examRoutes');
const smartScheduleRoutes = require('./routes/smartScheduleRoutes');
const tipsRoutes = require('./routes/tipsRoutes');
const preferenceRoutes = require('./routes/preferenceRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();

// Update CORS configuration to allow Authorization header from frontend
app.use(cors({
  origin: function(origin, callback) {
    // Allow any origin that includes localhost
    if (!origin || origin.includes('localhost')) {
      console.log('Allowing CORS for origin:', origin);
      callback(null, true);
    } else {
      console.log('Blocking CORS for origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Mount routes
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api', classRoutes);
app.use('/api', examRoutes);
app.use('/api', smartScheduleRoutes);
app.use('/api', tipsRoutes);
app.use('/api', preferenceRoutes);
app.use('/api', analyticsRoutes);

const PORT = process.env.PORT || 5000;

// Set MongoDB URI directly if environment variable is not available
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_study_db';
console.log('MongoDB URI:', MONGODB_URI);

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connected ✅');
  app.listen(PORT, () => console.log(`Server running on port ${PORT} 🚀`));
}).catch(err => console.log(err));
