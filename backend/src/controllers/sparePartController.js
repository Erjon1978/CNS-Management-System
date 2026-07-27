const SparePart = require('../models/SparePart');
const System = require('../models/System');
const ActivityLog = require('../models/ActivityLog');

// @desc    Create spare part
// @route   POST /api/spare-parts
const createSparePart = async (req, res) => {
  try {
    const {
      name,
      partNumber,
      description,
      manufacturer,
      quantity,
      minimumQuantity,
      location,
      compatibleSystems,
      price,
      supplier,
      leadTime,
      datasheet
    } = req.body;

    const existingPart = await SparePart.findOne({ partNumber });
    if (existingPart) {
      return res.status(400).json({ message: 'Part number already exists' });
    }

    const sparePart = await SparePart.create({
      name,
      partNumber,
      description,
      manufacturer,
      quantity: quantity || 0,
      minimumQuantity: minimumQuantity || 5,
      location,
      compatibleSystems,
      price,
      supplier,
      leadTime,
      datasheet
    });

    await ActivityLog.create({
      user: req.user.id,
      action: 'SPARE_PART_CREATED',
      details: `Spare part "${name}" created`,
      ipAddress: req.ip
    });

    res.status(201).json(sparePart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get spare parts with filters
// @route   GET /api/spare-parts
const getSpareParts = async (req, res) => {
  try {
    const {
      search,
      manufacturer,
      location,
      lowStock,
      page = 1,
      limit = 20
    } = req.query;

    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { partNumber: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (manufacturer) query.manufacturer = manufacturer;
    if (location) query.location = location;
    if (lowStock === 'true') {
      query.$expr = { $lt: ['$quantity', '$minimumQuantity'] };
    }

    const skip = (page - 1) * limit;

    const [spareParts, total] = await Promise.all([
      SparePart.find(query)
        .populate('compatibleSystems', 'name systemType serialNumber')
        .skip(skip)
        .limit(limit)
        .sort({ name: 1 }),
      SparePart.countDocuments(query)
    ]);

    res.json({
      spareParts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get spare part by ID
// @route   GET /api/spare-parts/:id
const getSparePartById = async (req, res) => {
  try {
    const sparePart = await SparePart.findById(req.params.id)
      .populate('compatibleSystems', 'name systemType serialNumber manufacturer');

    if (!sparePart) {
      return res.status(404).json({ message: 'Spare part not found' });
    }

    res.json(sparePart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update spare part
// @route   PUT /api/spare-parts/:id
const updateSparePart = async (req, res) => {
  try {
    const sparePart = await SparePart.findById(req.params.id);
    if (!sparePart) {
      return res.status(404).json({ message: 'Spare part not found' });
    }

    const updatedPart = await SparePart.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    await ActivityLog.create({
      user: req.user.id,
      action: 'SPARE_PART_UPDATED',
      details: `Spare part "${sparePart.name}" updated`,
      ipAddress: req.ip
    });

    res.json(updatedPart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete spare part
// @route   DELETE /api/spare-parts/:id
const deleteSparePart = async (req, res) => {
  try {
    const sparePart = await SparePart.findById(req.params.id);
    if (!sparePart) {
      return res.status(404).json({ message: 'Spare part not found' });
    }

    await sparePart.deleteOne();

    await ActivityLog.create({
      user: req.user.id,
      action: 'SPARE_PART_DELETED',
      details: `Spare part "${sparePart.name}" deleted`,
      ipAddress: req.ip
    });

    res.json({ message: 'Spare part deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update stock
// @route   PATCH /api/spare-parts/:id/stock
const updateStock = async (req, res) => {
  try {
    const { quantity, operation } = req.body;
    const sparePart = await SparePart.findById(req.params.id);

    if (!sparePart) {
      return res.status(404).json({ message: 'Spare part not found' });
    }

    if (operation === 'add') {
      sparePart.quantity += quantity;
    } else if (operation === 'subtract') {
      if (sparePart.quantity < quantity) {
        return res.status(400).json({ message: 'Insufficient stock' });
      }
      sparePart.quantity -= quantity;
    } else {
      sparePart.quantity = quantity;
    }

    await sparePart.save();

    // Check if stock is low
    if (sparePart.quantity < sparePart.minimumQuantity) {
      req.app.get('io').emit('low_stock_alert', {
        partId: sparePart._id,
        partName: sparePart.name,
        quantity: sparePart.quantity,
        minimumQuantity: sparePart.minimumQuantity
      });
    }

    await ActivityLog.create({
      user: req.user.id,
      action: 'STOCK_UPDATED',
      details: `Stock updated for "${sparePart.name}" - New quantity: ${sparePart.quantity}`,
      ipAddress: req.ip
    });

    res.json(sparePart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get low stock parts
// @route   GET /api/spare-parts/low-stock
const getLowStockParts = async (req, res) => {
  try {
    const lowStockParts = await SparePart.find({
      $expr: { $lt: ['$quantity', '$minimumQuantity'] }
    }).sort({ quantity: 1 });

    res.json(lowStockParts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get spare part statistics
// @route   GET /api/spare-parts/stats
const getSparePartStats = async (req, res) => {
  try {
    const stats = await SparePart.aggregate([
      {
        $group: {
          _id: null,
          totalParts: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalValue: { $sum: { $multiply: ['$quantity', '$price'] } },
          lowStockCount: {
            $sum: {
              $cond: [{ $lt: ['$quantity', '$minimumQuantity'] }, 1, 0]
            }
          }
        }
      }
    ]);

    const manufacturerStats = await SparePart.aggregate([
      {
        $group: {
          _id: '$manufacturer',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      ...stats[0],
      manufacturerStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createSparePart,
  getSpareParts,
  getSparePartById,
  updateSparePart,
  deleteSparePart,
  updateStock,
  getLowStockParts,
  getSparePartStats
};