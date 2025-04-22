const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const auth = require('../middleware/auth');  // JWT middleware

// Routes
router.post('/exams', auth, examController.createExam);
router.get('/exams', auth, examController.getUserExams);
router.put('/exams/:id', auth, examController.updateExam);
router.delete('/exams/:id', auth, examController.deleteExam);

module.exports = router;
