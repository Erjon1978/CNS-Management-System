const Incident = require('../models/Incident');
const System = require('../models/System');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { INCIDENT_TYPES } = require('../config/constants');

// @desc    Create incident
// @route   POST /api/incidents
const createIncident = async (req, res) => {
  try {
    const {
      system,
      title,
      description,
      incidentType,
      severity,
      assignedTo,
      detectedAt,
      serviceImpact,
      classification
    } = req.body;

    // Verify system exists
    const systemDoc = await System.findById(system);
    if (!systemDoc) {
      return res.status(404).json({ message: 'System not found' });
    }

    // Check if user has access to this system
    if (req.user.role !== 'admin') {
      const user = await User.findById(req.user.id);
      if (user.group && systemDoc.assignedGroup && 
          systemDoc.assignedGroup.toString() !== user.group.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const incident = await Incident.create({
      system,
      title,
      description,
      incidentType,
      severity: severity || 'medium',
      reportedBy: req.user.id,
      assignedTo: assignedTo || req.user.id,
      detectedAt: detectedAt || new Date(),
      serviceImpact,
      classification: classification || 'incident',
      actionsTaken: [{
        action: 'Incident reported',
        performedBy: req.user.id,
        notes: 'Initial report'
      }]
    });

    // Update system metrics
    systemDoc.metrics.totalIncidents = (systemDoc.metrics.totalIncidents || 0) + 1;
    await systemDoc.save();

    await ActivityLog.create({
      user: req.user.id,
      action: 'INCIDENT_CREATED',
      incident: incident._id,
      system: system,
      details: `Incident "${title}" reported for system ${systemDoc.name}`,
      ipAddress: req.ip
    });

    req.app.get('io').emit('incident_created', incident);

    res.status(201).json(incident);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get incidents with filters
// @route   GET /api/incidents
const getIncidents = async (req, res) => {
  try {
    const {
      status,
      severity,
      incidentType,
      system,
      assignedTo,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;

    let query = {};

    if (status) query.status = status;
    if (severity) query.severity = severity;
    if (incidentType) query.incidentType = incidentType;
    if (system) query.system = system;
    if (assignedTo) query.assignedTo = assignedTo;
    if (startDate) query.reportedAt = { $gte: new Date(startDate) };
    if (endDate) query.reportedAt = { ...query.reportedAt, $lte: new Date(endDate) };

    // Filter by user access
    if (req.user.role !== 'admin') {
      const user = await User.findById(req.user.id);
      if (user.group) {
        const systems = await System.find({ assignedGroup: user.group });
        const systemIds = systems.map(s => s._id);
        query.system = { $in: systemIds };
      } else {
        query.$or = [
          { reportedBy: req.user.id },
          { assignedTo: req.user.id }
        ];
      }
    }

    const skip = (page - 1) * limit;

    const [incidents, total] = await Promise.all([
      Incident.find(query)
        .populate('system', 'name systemType serialNumber')
        .populate('reportedBy', 'firstName lastName username')
        .populate('assignedTo', 'firstName lastName username')
        .populate('actionsTaken.performedBy', 'firstName lastName')
        .populate('rootCause.confirmedBy', 'firstName lastName')
        .populate('solution.implementedBy', 'firstName lastName')
        .populate('solution.verifiedBy', 'firstName lastName')
        .skip(skip)
        .limit(limit)
        .sort({ reportedAt: -1 }),
      Incident.countDocuments(query)
    ]);

    res.json({
      incidents,
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

// @desc    Get incident by ID
// @route   GET /api/incidents/:id
const getIncidentById = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate('system', 'name systemType serialNumber location')
      .populate('reportedBy', 'firstName lastName username email')
      .populate('assignedTo', 'firstName lastName username')
      .populate('actionsTaken.performedBy', 'firstName lastName')
      .populate('rootCause.confirmedBy', 'firstName lastName')
      .populate('solution.implementedBy', 'firstName lastName')
      .populate('solution.verifiedBy', 'firstName lastName')
      .populate('sparesUsed.part', 'name partNumber');

    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    res.json(incident);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update incident
// @route   PUT /api/incidents/:id
const updateIncident = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    const updatedIncident = await Incident.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    await ActivityLog.create({
      user: req.user.id,
      action: 'INCIDENT_UPDATED',
      incident: incident._id,
      details: `Incident "${incident.title}" updated`,
      ipAddress: req.ip
    });

    req.app.get('io').emit('incident_updated', updatedIncident);

    res.json(updatedIncident);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update incident status
// @route   PATCH /api/incidents/:id/status
const updateIncidentStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    incident.status = status;
    if (status === 'resolved' || status === 'closed') {
      incident.resolutionDate = new Date();
    }
    await incident.save();

    // Add action to timeline
    incident.actionsTaken.push({
      action: `Status changed to ${status}`,
      performedBy: req.user.id,
      notes: notes || ''
    });
    await incident.save();

    await ActivityLog.create({
      user: req.user.id,
      action: 'INCIDENT_STATUS_CHANGED',
      incident: incident._id,
      details: `Incident status changed to ${status}`,
      ipAddress: req.ip,
      metadata: { notes }
    });

    req.app.get('io').emit('incident_status_changed', incident);

    res.json(incident);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add action to incident
// @route   POST /api/incidents/:id/actions
const addActionToIncident = async (req, res) => {
  try {
    const { action, notes } = req.body;
    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    incident.actionsTaken.push({
      action,
      performedBy: req.user.id,
      notes
    });
    await incident.save();

    await ActivityLog.create({
      user: req.user.id,
      action: 'INCIDENT_ACTION_ADDED',
      incident: incident._id,
      details: `Action added: ${action}`,
      ipAddress: req.ip
    });

    res.json(incident);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Resolve incident
// @route   PATCH /api/incidents/:id/resolve
const resolveIncident = async (req, res) => {
  try {
    const {
      solution,
      rootCause,
      sparesUsed,
      lessonsLearned,
      preventiveActions,
      downtime
    } = req.body;

    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    incident.status = 'resolved';
    incident.resolutionDate = new Date();
    incident.solution = {
      description: solution,
      implementedBy: req.user.id,
      implementedAt: new Date()
    };
    if (rootCause) incident.rootCause = rootCause;
    if (sparesUsed) incident.sparesUsed = sparesUsed;
    if (lessonsLearned) incident.lessonsLearned = lessonsLearned;
    if (preventiveActions) incident.preventiveActions = preventiveActions;
    if (downtime) incident.downtime = downtime;

    await incident.save();

    await ActivityLog.create({
      user: req.user.id,
      action: 'INCIDENT_RESOLVED',
      incident: incident._id,
      details: `Incident "${incident.title}" resolved`,
      ipAddress: req.ip
    });

    req.app.get('io').emit('incident_resolved', incident);

    res.json(incident);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get incident statistics
// @route   GET /api/incidents/stats
const getIncidentStats = async (req, res) => {
  try {
    const stats = await Incident.aggregate([
      {
        $group: {
          _id: {
            severity: '$severity',
            status: '$status'
          },
          count: { $sum: 1 },
          avgDowntime: { $avg: '$downtime' }
        }
      },
      {
        $group: {
          _id: '$_id.severity',
          statuses: {
            $push: {
              status: '$_id.status',
              count: '$count',
              avgDowntime: '$avgDowntime'
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
  createIncident,
  getIncidents,
  getIncidentById,
  updateIncident,
  updateIncidentStatus,
  addActionToIncident,
  resolveIncident,
  getIncidentStats
};