const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  weekStartDate: {
    type: Date
  },
  weekEndDate: {
    type: Date
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  totalSlots: {
    type: Number,
    default: 0
  },
  confirmedSlots: {
    type: Number,
    default: 0
  },
  completedSlots: {
    type: Number,
    default: 0
  },
  deletedSlots: {
    type: Number,
    default: 0
  },
  subjects: {
    type: Object,
    default: {}
  },
  taskCompletionRate: {
    type: Number, // percentage
    min: 0,
    max: 100,
    default: 0
  },
  totalStudyHours: {
    type: Number,
    default: 0
  },
  subjectBreakdown: [{
    subject: String,
    hours: Number,
    taskCount: Number,
    completedTaskCount: Number
  }],
  insights: [{
    text: String,
    category: {
      type: String,
      enum: ['achievement', 'improvement', 'suggestion', 'warning'],
      default: 'suggestion'
    },
    source: {
      type: String,
      enum: ['gemini', 'rule-based', 'openai', 'anthropic', 'other'],
      default: 'gemini'
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
analyticsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// No unique index constraint
// Just create a simple index for faster queries
analyticsSchema.index({ userId: 1 });

module.exports = mongoose.model('Analytics', analyticsSchema);
