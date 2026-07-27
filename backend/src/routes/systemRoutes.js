const express = require('express');
const { 
  createSystem,
  getSystems,
  getSystemById,
  updateSystem,
  updateSystemStatus,
  getSystemStats
} = require('../controllers/systemController');
const { protect, admin, manager } = require('../middleware/auth');
const { validate, validateSystem } = require('../middleware/validation');

const router = express.Router();

// All routes require authentication
router.use(protect);

// System statistics
router.get('/stats', getSystemStats);

// CRUD operations
router.route('/')
  .get(getSystems)
  .post(manager, validate(validateSystem), createSystem);

router.route('/:id')
  .get(getSystemById)
  .put(manager, validate(validateSystem), updateSystem);

// Status update
router.patch('/:id/status', manager, updateSystemStatus);

module.exports = router;