const express = require('express');
const {
  getDashboardStats,
  getSystemStatusDistribution,
  getTaskOverview,
  getIncidentOverview,
  getRecentActivity,
  getPerformanceMetrics
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Main dashboard statistics
router.get('/stats', getDashboardStats);

// System status distribution
router.get('/system-status', getSystemStatusDistribution);

// Task overview
router.get('/task-overview', getTaskOverview);

// Incident overview
router.get('/incident-overview', getIncidentOverview);

// Recent activity
router.get('/recent-activity', getRecentActivity);

// Performance metrics
router.get('/performance', getPerformanceMetrics);

module.exports = router;