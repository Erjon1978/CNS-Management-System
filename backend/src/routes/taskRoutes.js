const express = require('express');
const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask,
  getTaskStats
} = require('../controllers/taskController');
const { protect, manager } = require('../middleware/auth');
const { validate, validateTask } = require('../middleware/validation');

const router = express.Router();

router.use(protect);

router.get('/stats', getTaskStats);
router.route('/')
  .get(getTasks)
  .post(manager, validate(validateTask), createTask);

router.route('/:id')
  .get(getTaskById)
  .put(manager, validate(validateTask), updateTask)
  .delete(manager, deleteTask);

router.patch('/:id/status', updateTaskStatus);

module.exports = router;