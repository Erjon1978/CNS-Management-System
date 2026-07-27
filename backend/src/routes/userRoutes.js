const express = require('express');
const {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  toggleUserStatus,
  assignUserToGroup,
  addCertification,
  removeCertification,
  addTraining,
  addVacation,
  addExtraHours,
  getUserStats
} = require('../controllers/userController');
const { protect, admin, manager } = require('../middleware/auth');
const { validate, validateUser } = require('../middleware/validation');

const router = express.Router();

// All routes require authentication
router.use(protect);

// User statistics (admin only)
router.get('/stats', admin, getUserStats);

// CRUD operations (admin only for full access)
// Note: user creation is handled by POST /api/auth/register (admin only)
router.route('/')
  .get(admin, getUsers);

router.route('/:id')
  .get(admin, getUserById)
  .put(admin, validate(validateUser), updateUser)
  .delete(admin, deleteUser);

// Toggle user status (admin only)
router.patch('/:id/toggle-status', admin, toggleUserStatus);

// Group assignment (admin/manager)
router.patch('/:id/group', manager, assignUserToGroup);

// Certifications management (admin/manager)
router.post('/:id/certifications', manager, addCertification);
router.delete('/:id/certifications/:certification', manager, removeCertification);

// Training management (admin/manager)
router.post('/:id/trainings', manager, addTraining);

// Vacation management (admin/manager)
router.post('/:id/vacation', manager, addVacation);

// Extra hours management (admin/manager)
router.post('/:id/extra-hours', manager, addExtraHours);

module.exports = router;