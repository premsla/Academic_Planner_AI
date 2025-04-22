/**
 * Analytics Routes
 */

const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const auth = require('../middleware/auth');

// Generate analytics
router.post('/analytics/generate', auth, analyticsController.generateAnalytics);

// Get analytics
router.get('/analytics', auth, analyticsController.getAnalytics);

// Get analytics history
router.get('/analytics/history', auth, analyticsController.getAnalyticsHistory);

module.exports = router;
