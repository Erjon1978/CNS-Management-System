const express = require('express');
const {
  createGroup,
  getGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  addMemberToGroup,
  removeMemberFromGroup,
  assignSystemToGroup,
  removeSystemFromGroup,
  getGroupStats
} = require('../controllers/groupController');
const { protect, admin, manager } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Group statistics (admin only)
router.get('/stats', admin, getGroupStats);

// CRUD operations
router.route('/')
  .get(getGroups)
  .post(admin, createGroup);

router.route('/:id')
  .get(getGroupById)
  .put(admin, updateGroup)
  .delete(admin, deleteGroup);

// Member management
router.post('/:id/members', admin, addMemberToGroup);
router.delete('/:id/members/:userId', admin, removeMemberFromGroup);

// System assignment
router.post('/:id/systems', admin, assignSystemToGroup);
router.delete('/:id/systems/:systemId', admin, removeSystemFromGroup);

module.exports = router;