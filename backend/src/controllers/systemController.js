const System = require('../models/System');
const User = require('../models/User');
const Group = require('../models/Group');
const ActivityLog = require('../models/ActivityLog');
const { SYSTEM_TYPES, SYSTEM_STATUS } = require('../config/constants');

// Helper function to get required certifications
const getRequiredCertifications = (systemType, subsystem) => {
  const certMap = {
    communication: ['electronics', 'rf'],
    navigation: ['electronics', 'navigation'],
    surveillance: ['electronics', 'radar'],
    data_processing: ['software', 'electronics'],
    meteorological: ['electronics', 'mechanical']
  };
  
  return certMap[systemType] || ['electronics'];
};

// @desc    Create CNS system
// @route   POST /api/systems
const createSystem = async (req, res) => {
  try {
    const {
      name,
      systemType,
      subsystem,
      serialNumber,
      manufacturer,
      model,
      firmwareVersion,
      softwareVersion,
      hardwareVersion,
      installationDate,
      commissionDate,
      location,
      serviceLevel,
      powerSupply,
      redundancyLevel,
      criticality,
      atsImpact,
      configuration,
      assignedGroup
    } = req.body;

    // Validate system type
    if (!SYSTEM_TYPES[systemType.toUpperCase()]) {
      return res.status(400).json({ message: 'Invalid system type' });
    }

    // Check certifications
    const user = await User.findById(req.user.id).populate('group');
    const requiredCerts = getRequiredCertifications(systemType, subsystem);
    
    if (assignedGroup) {
      const group = await Group.findById(assignedGroup);
      const hasRequiredCert = requiredCerts.every(cert => 
        group.certifications.includes(cert) || user.certifications.includes(cert)
      );
      
      if (!hasRequiredCert) {
        return res.status(403).json({ 
          message: 'Group or user does not have required certifications',
          required: requiredCerts
        });
      }
    }

    const system = await System.create({
      name,
      systemType,
      subsystem,
      serialNumber,
      manufacturer,
      model,
      firmwareVersion,
      softwareVersion,
      hardwareVersion,
      installationDate,
      commissionDate,
      location,
      serviceLevel,
      powerSupply,
      redundancyLevel,
      criticality,
      atsImpact,
      configuration: new Map(Object.entries(configuration || {})),
      createdBy: req.user.id,
      assignedGroup
    });

    // Log activity
    await ActivityLog.create({
      user: req.user.id,
      action: 'SYSTEM_CREATED',
      system: system._id,
      details: `${name} (${systemType}) created`,
      ipAddress: req.ip
    });

    // Emit socket event
    req.app.get('io').emit('system_created', system);

    res.status(201).json(system);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all systems with filters
// @route   GET /api/systems
const getSystems = async (req, res) => {
  try {
    const { 
      systemType, 
      subsystem, 
      status, 
      serviceLevel,
      site,
      assignedGroup,
      search,
      page = 1,
      limit = 20
    } = req.query;
    
    let query = {};
    
    // Apply filters
    if (systemType) query.systemType = systemType;
    if (subsystem) query.subsystem = subsystem;
    if (status) query.status = status;
    if (serviceLevel) query.serviceLevel = serviceLevel;
    if (site) query['location.site'] = site;
    if (assignedGroup) query.assignedGroup = assignedGroup;
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { serialNumber: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by user access
    if (req.user.role !== 'admin') {
      const user = await User.findById(req.user.id);
      if (user.group) {
        query.assignedGroup = user.group;
      } else {
        query.createdBy = req.user.id;
      }
    }

    const skip = (page - 1) * limit;
    
    const [systems, total] = await Promise.all([
      System.find(query)
        .populate('createdBy', 'firstName lastName username')
        .populate('assignedGroup', 'name type')
        .populate('spareParts.part')
        .populate('networkConnections.connectedSystem', 'name systemType')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      System.countDocuments(query)
    ]);

    res.json({
      systems,
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

// @desc    Get single system
// @route   GET /api/systems/:id
const getSystemById = async (req, res) => {
  try {
    const system = await System.findById(req.params.id)
      .populate('createdBy', 'firstName lastName username')
      .populate('assignedGroup', 'name type')
      .populate('spareParts.part')
      .populate('networkConnections.connectedSystem', 'name systemType status')
      .populate('maintenanceHistory.performedBy', 'firstName lastName');

    if (!system) {
      return res.status(404).json({ message: 'System not found' });
    }

    // Check access
    if (req.user.role !== 'admin') {
      const user = await User.findById(req.user.id);
      if (user.group && system.assignedGroup && 
          system.assignedGroup._id.toString() !== user.group.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json(system);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update system
// @route   PUT /api/systems/:id
const updateSystem = async (req, res) => {
  try {
    const system = await System.findById(req.params.id);
    if (!system) {
      return res.status(404).json({ message: 'System not found' });
    }

    // Check access
    if (req.user.role !== 'admin' && system.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedSystem = await System.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    // Log activity
    await ActivityLog.create({
      user: req.user.id,
      action: 'SYSTEM_UPDATED',
      system: system._id,
      details: `${system.name} updated`,
      ipAddress: req.ip
    });

    // Emit socket event
    req.app.get('io').emit('system_updated', updatedSystem);

    res.json(updatedSystem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update system status
// @route   PATCH /api/systems/:id/status
const updateSystemStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    
    if (!Object.values(SYSTEM_STATUS).includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const system = await System.findById(req.params.id);
    if (!system) {
      return res.status(404).json({ message: 'System not found' });
    }

    system.status = status;
    system.updatedAt = Date.now();
    await system.save();

    // Log activity
    await ActivityLog.create({
      user: req.user.id,
      action: 'SYSTEM_STATUS_CHANGED',
      system: system._id,
      details: `Status changed to ${status}`,
      ipAddress: req.ip,
      metadata: { notes }
    });

    // Emit socket event
    req.app.get('io').emit('system_status_changed', system);

    res.json(system);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get system statistics
// @route   GET /api/systems/stats
const getSystemStats = async (req, res) => {
  try {
    const stats = await System.aggregate([
      {
        $group: {
          _id: {
            type: '$systemType',
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.type',
          statuses: {
            $push: {
              status: '$_id.status',
              count: '$count'
            }
          },
          total: { $sum: '$count' }
        }
      }
    ]);

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createSystem,
  getSystems,
  getSystemById,
  updateSystem,
  updateSystemStatus,
  getSystemStats
};