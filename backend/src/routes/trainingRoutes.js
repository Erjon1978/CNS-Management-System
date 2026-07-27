const express = require('express');
const {
  createTraining,
  getTrainings,
  getTrainingById,
  updateTraining,
  deleteTraining,
  registerForTraining,
  markAttendance,
  getUpcomingTrainings,
  getTrainingStats
} = require('../controllers/trainingController');
const { protect, admin, manager } = require('../middleware/auth');
const { validate, validateTraining } = require('../middleware/validation');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Training statistics
router.get('/stats', getTrainingStats);

// Upcoming trainings
router.get('/upcoming', getUpcomingTrainings);

// CRUD operations
router.route('/')
  .get(getTrainings)
  .post(manager, validate(validateTraining), createTraining);

router.route('/:id')
  .get(getTrainingById)
  .put(manager, validate(validateTraining), updateTraining)
  .delete(admin, deleteTraining);

// Registration
router.post('/:id/register', registerForTraining);

// Attendance
router.patch('/:id/attendance', markAttendance);

module.exports = router;