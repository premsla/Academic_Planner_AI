const mongoose = require('mongoose');

const preferenceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studyPreferences: {
    preferredTimes: {
      type: [String],
      enum: ['morning', 'afternoon', 'evening', 'night'],
      default: ['evening']
    },
    preferredDuration: {
      type: Number, // in minutes
      default: 60,
      min: 15,
      max: 180
    },
    preferredEnvironment: {
      type: String,
      enum: ['quiet', 'background music', 'ambient noise', 'any'],
      default: 'quiet'
    },
    learningStyle: {
      type: String,
      enum: ['visual', 'auditory', 'reading/writing', 'kinesthetic', 'unknown'],
      default: 'unknown'
    }
  },
  dailyRoutine: {
    playTime: {
      type: Number, // in minutes
      default: 60
    },
    mealTime: {
      type: Number, // in minutes
      default: 60
    },
    otherRoutines: [{
      name: String,
      duration: Number, // in minutes
      startTime: String, // HH:MM format
      days: [String] // days of week
    }]
  },
  productivityPatterns: {
    mostProductiveDay: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'unknown'],
      default: 'unknown'
    },
    mostProductiveTime: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'night', 'unknown'],
      default: 'evening'
    },
    averageStudyStreak: {
      type: Number, // in days
      default: 0
    },
    taskCompletionRate: {
      type: Number, // percentage
      default: 0,
      min: 0,
      max: 100
    }
  },
  subjectPreferences: [{
    subject: String,
    preferredMethod: {
      type: String,
      enum: ['reading', 'practice problems', 'flashcards', 'group study', 'video tutorials', 'unknown'],
      default: 'unknown'
    },
    difficulty: {
      type: Number, // 1-5 scale
      min: 1,
      max: 5,
      default: 3
    },
    priority: {
      type: Number, // 1-5 scale
      min: 1,
      max: 5,
      default: 3
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
preferenceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Preference', preferenceSchema);
