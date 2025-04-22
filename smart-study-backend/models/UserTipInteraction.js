const mongoose = require('mongoose');

const userTipInteractionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tipId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tip',
    required: true
  },
  isHelpful: {
    type: Boolean,
    default: null
  },
  isViewed: {
    type: Boolean,
    default: false
  },
  viewCount: {
    type: Number,
    default: 0
  },
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
userTipInteractionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create a compound index to ensure a user can only have one interaction per tip
userTipInteractionSchema.index({ userId: 1, tipId: 1 }, { unique: true });

module.exports = mongoose.model('UserTipInteraction', userTipInteractionSchema);
