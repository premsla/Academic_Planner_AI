const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createTask, getTasks, getTaskById, updateTask, deleteTask
} = require('../controllers/taskController');

router.post('/', auth, createTask);
router.get('/', auth, getTasks);
router.get('/:id', auth, getTaskById);
router.put('/:id', auth, updateTask);
router.delete('/:id', auth, deleteTask);

module.exports = router;
