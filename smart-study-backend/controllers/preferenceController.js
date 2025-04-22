const Preference = require('../models/Preference');
const nlpService = require('../services/nlpService');

// Get user preferences
exports.getUserPreferences = async (req, res) => {
  try {
    const userId = req.userId; // From JWT middleware
    
    // Find user preferences or create default
    let preferences = await Preference.findOne({ userId });
    
    if (!preferences) {
      // Create default preferences
      preferences = new Preference({
        userId,
        studyPreferences: {
          preferredTimes: ['afternoon'],
          preferredDuration: 45,
          preferredEnvironment: 'quiet',
          learningStyle: 'unknown'
        },
        productivityPatterns: {
          mostProductiveDay: 'unknown',
          mostProductiveTime: 'unknown',
          averageStudyStreak: 0
        },
        subjectPreferences: []
      });
      
      await preferences.save();
    }
    
    res.status(200).json(preferences);
  } catch (error) {
    console.error('Error getting user preferences:', error);
    res.status(500).json({ message: 'Error getting user preferences', error: error.message });
  }
};

// Update user preferences
exports.updatePreferences = async (req, res) => {
  try {
    const userId = req.userId; // From JWT middleware
    const { 
      studyPreferences, 
      productivityPatterns, 
      subjectPreferences 
    } = req.body;
    
    // Find user preferences or create new
    let preferences = await Preference.findOne({ userId });
    
    if (!preferences) {
      preferences = new Preference({ userId });
    }
    
    // Update fields if provided
    if (studyPreferences) {
      preferences.studyPreferences = {
        ...preferences.studyPreferences,
        ...studyPreferences
      };
    }
    
    if (productivityPatterns) {
      preferences.productivityPatterns = {
        ...preferences.productivityPatterns,
        ...productivityPatterns
      };
    }
    
    if (subjectPreferences) {
      preferences.subjectPreferences = subjectPreferences;
    }
    
    // Save updated preferences
    await preferences.save();
    
    res.status(200).json({ message: 'Preferences updated successfully', preferences });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ message: 'Error updating preferences', error: error.message });
  }
};

// Add a subject preference
exports.addSubjectPreference = async (req, res) => {
  try {
    const userId = req.userId; // From JWT middleware
    const { subject, preferredMethod, difficulty } = req.body;
    
    if (!subject) {
      return res.status(400).json({ message: 'Subject is required' });
    }
    
    // Find user preferences or create new
    let preferences = await Preference.findOne({ userId });
    
    if (!preferences) {
      preferences = new Preference({ 
        userId,
        subjectPreferences: []
      });
    }
    
    // Check if subject already exists
    const existingIndex = preferences.subjectPreferences.findIndex(
      pref => pref.subject.toLowerCase() === subject.toLowerCase()
    );
    
    if (existingIndex !== -1) {
      // Update existing subject preference
      preferences.subjectPreferences[existingIndex] = {
        ...preferences.subjectPreferences[existingIndex],
        preferredMethod: preferredMethod || preferences.subjectPreferences[existingIndex].preferredMethod,
        difficulty: difficulty || preferences.subjectPreferences[existingIndex].difficulty
      };
    } else {
      // Add new subject preference
      preferences.subjectPreferences.push({
        subject,
        preferredMethod: preferredMethod || 'unknown',
        difficulty: difficulty || 3
      });
    }
    
    // Save updated preferences
    await preferences.save();
    
    res.status(200).json({ message: 'Subject preference added', preferences });
  } catch (error) {
    console.error('Error adding subject preference:', error);
    res.status(500).json({ message: 'Error adding subject preference', error: error.message });
  }
};

// Analyze user behavior to update preferences automatically
exports.analyzeUserBehavior = async (req, res) => {
  try {
    const userId = req.userId; // From JWT middleware
    
    // This would typically analyze user's completed tasks, study patterns, etc.
    // For now, we'll just return the current preferences
    
    const preferences = await Preference.findOne({ userId });
    
    if (!preferences) {
      return res.status(404).json({ message: 'User preferences not found' });
    }
    
    res.status(200).json({ 
      message: 'User behavior analysis complete', 
      preferences 
    });
  } catch (error) {
    console.error('Error analyzing user behavior:', error);
    res.status(500).json({ message: 'Error analyzing user behavior', error: error.message });
  }
};
