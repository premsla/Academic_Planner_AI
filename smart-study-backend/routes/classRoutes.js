const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const auth = require('../middleware/auth'); // JWT Middleware

router.post('/classes', auth, classController.createClass);
router.get('/classes', auth, classController.getUserClasses);
router.put('/classes/:id', auth, classController.updateClass);
router.delete('/classes/:id', auth, classController.deleteClass);

module.exports = router;
