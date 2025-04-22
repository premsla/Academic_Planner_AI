/**
 * Tips Routes
 */

const express = require('express');
const router = express.Router();
const tipsController = require('../controllers/tipsController');
const auth = require('../middleware/auth');

// Generate personalized tips
router.post('/tips/generate', auth, tipsController.generateTips);

// Get personalized tips for the user
router.get('/tips', auth, tipsController.getPersonalizedTips);

// Mark a tip as helpful or not helpful
router.put('/tips/:tipId/feedback', auth, tipsController.markTipHelpfulness);

// Get all tips (admin only)
router.get('/tips/all', auth, tipsController.getAllTips);

// Create a new tip (admin only)
router.post('/tips/create', auth, tipsController.createTip);

module.exports = router;
