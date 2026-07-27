const express = require('express');
const {
  createIncident,
  getIncidents,
  getIncidentById,
  updateIncident,
  updateIncidentStatus,
  addActionToIncident,
  resolveIncident,
  getIncidentStats
} = require('../controllers/incidentController');
const { protect, admin, manager } = require('../middleware/auth');
const { validate, validateIncident } = require('../middleware/validation');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Incident statistics
router.get('/stats', getIncidentStats);

// CRUD operations
router.route('/')
  .get(getIncidents)
  .post(validate(validateIncident), createIncident);

router.route('/:id')
  .get(getIncidentById)
  .put(manager, validate(validateIncident), updateIncident);

// Status update
router.patch('/:id/status', updateIncidentStatus);

// Add action to incident
router.post('/:id/actions', addActionToIncident);

// Resolve incident
router.patch('/:id/resolve', manager, resolveIncident);

module.exports = router;