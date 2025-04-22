/**
 * Smart Schedule Routes
 */

const express = require('express');
const router = express.Router();
const smartScheduleController = require('../controllers/smartScheduleController');
const auth = require('../middleware/auth');

// Generate a smart schedule
router.post('/smart-schedule/generate', auth, smartScheduleController.generateSmartSchedule);

// Get AI-suggested study slots
router.get('/smart-schedule', auth, smartScheduleController.getSmartSchedule);

// Confirm a suggested study slot
router.put('/smart-schedule/:slotId/confirm', auth, smartScheduleController.confirmStudySlot);

// Mark a study slot as completed
router.put('/smart-schedule/:slotId/complete', auth, smartScheduleController.completeStudySlot);

// Create a custom study slot
router.post('/smart-schedule/custom', auth, smartScheduleController.createCustomStudySlot);

// Save a new study slot (legacy)
router.post('/smart-schedule', auth, smartScheduleController.saveStudySlot);

// Get all confirmed study slots
router.get('/smart-schedule/confirmed', auth, smartScheduleController.getConfirmedStudySlots);

// Delete a study slot
router.delete('/smart-schedule/:slotId', auth, smartScheduleController.deleteStudySlot);

module.exports = router;
