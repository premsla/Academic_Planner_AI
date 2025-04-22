const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  day_of_week: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true
  },
  start_time: {
    type: String, // Format: "14:00"
    required: true
  },
  end_time: {
    type: String, // Format: "15:30"
    required: true
  },
  repeat_weekly: {
    type: Boolean,
    default: true
  },
  location: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const Class = mongoose.model('Class', classSchema);

module.exports = Class;
