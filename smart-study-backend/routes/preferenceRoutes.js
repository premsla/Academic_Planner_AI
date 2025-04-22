const express = require('express');
const router = express.Router();
const preferenceController = require('../controllers/preferenceController');
const auth = require('../middleware/auth');

// Get user preferences
router.get('/preferences', auth, preferenceController.getUserPreferences);

// Update user preferences
router.put('/preferences', auth, preferenceController.updatePreferences);

// Add a subject preference
router.post('/preferences/subject', auth, preferenceController.addSubjectPreference);

// Analyze user behavior to update preferences automatically
router.get('/preferences/analyze', auth, preferenceController.analyzeUserBehavior);

module.exports = router;
