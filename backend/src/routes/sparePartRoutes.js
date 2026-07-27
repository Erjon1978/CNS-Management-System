const express = require('express');
const {
  createSparePart,
  getSpareParts,
  getSparePartById,
  updateSparePart,
  deleteSparePart,
  updateStock,
  getLowStockParts,
  getSparePartStats
} = require('../controllers/sparePartController');
const { protect, admin, manager } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get low stock parts
router.get('/low-stock', getLowStockParts);

// Statistics
router.get('/stats', getSparePartStats);

// CRUD operations
router.route('/')
  .get(getSpareParts)
  .post(manager, createSparePart);

router.route('/:id')
  .get(getSparePartById)
  .put(manager, updateSparePart)
  .delete(admin, deleteSparePart);

// Update stock
router.patch('/:id/stock', manager, updateStock);

module.exports = router;