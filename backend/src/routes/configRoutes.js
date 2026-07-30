const express = require('express');
const {
  getSystemTypes,
  createSystemType,
  updateSystemType,
  deleteSystemType,
  addSubsystem,
  updateSubsystem,
  deleteSubsystem,
  getCertifications,
  createCertification,
  updateCertification,
  deleteCertification
} = require('../controllers/configController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// System types
router.route('/system-types')
  .get(getSystemTypes)
  .post(admin, createSystemType);

router.route('/system-types/:id')
  .put(admin, updateSystemType)
  .delete(admin, deleteSystemType);

router.route('/system-types/:id/subsystems')
  .post(admin, addSubsystem);

router.route('/system-types/:id/subsystems/:subId')
  .put(admin, updateSubsystem)
  .delete(admin, deleteSubsystem);

// Certifications
router.route('/certifications')
  .get(getCertifications)
  .post(admin, createCertification);

router.route('/certifications/:id')
  .put(admin, updateCertification)
  .delete(admin, deleteCertification);

module.exports = router;
