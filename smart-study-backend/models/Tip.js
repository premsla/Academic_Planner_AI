const mongoose = require('mongoose');

const tipSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['productivity', 'study technique', 'subject specific', 'time management', 'motivation', 'general'],
    required: true
  },
  tags: {
    type: [String],
    default: []
  },
  subjects: {
    type: [String],
    default: []
  },
  difficulty: {
    type: Number, // 1-5 scale
    min: 1,
    max: 5,
    default: 3
  },
  learningStyles: {
    type: [String],
    enum: ['visual', 'auditory', 'reading/writing', 'kinesthetic', 'any'],
    default: ['any']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Tip', tipSchema);
