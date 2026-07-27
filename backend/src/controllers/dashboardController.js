const System = require('../models/System');
const Task = require('../models/Task');
const Incident = require('../models/Incident');
const User = require('../models/User');
const Group = require('../models/Group');
const SparePart = require('../models/SparePart');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
const getDashboardStats = async (req, res) => {
  try {
    // Get user's group access
    let groupFilter = {};
    if (req.user.role !== 'admin') {
      const user = await User.findById(req.user.id);
      if (user.group) {
        groupFilter = { assignedGroup: user.group };
      }
    }

    // System stats
    const totalSystems = await System.countDocuments(groupFilter);
    const activeSystems = await System.countDocuments({
      ...groupFilter,
      status: 'operational'
    });
    const systemsInMaintenance = await System.countDocuments({
      ...groupFilter,
      status: 'maintenance'
    });

    // Task stats
    const taskFilter = req.user.role !== 'admin' ? { assignedTo: req.user.id } : {};
    const openTasks = await Task.countDocuments({
      ...taskFilter,
      status: { $in: ['pending_approval', 'approved', 'in_progress'] }
    });
    const tasksInProgress = await Task.countDocuments({
      ...taskFilter,
      status: 'in_progress'
    });
    const overdueTasks = await Task.countDocuments({
      ...taskFilter,
      dueDate: { $lt: new Date() },
      status: { $nin: ['completed', 'cancelled'] }
    });

    // Incident stats
    const incidentFilter = req.user.role !== 'admin' ? { assignedTo: req.user.id } : {};
    const activeIncidents = await Incident.countDocuments({
      ...incidentFilter,
      status: { $in: ['reported', 'investigating', 'in_progress'] }
    });
    const criticalIncidents = await Incident.countDocuments({
      ...incidentFilter,
      severity: 'critical',
      status: { $in: ['reported', 'investigating', 'in_progress'] }
    });

    // User stats
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    
    // Team members in user's group
    let teamMembers = 0;
    if (req.user.role !== 'admin' && req.user.group) {
      teamMembers = await User.countDocuments({ group: req.user.group });
    } else if (req.user.role === 'admin') {
      teamMembers = totalUsers;
    }

    // Spare parts stats
    const lowStockParts = await SparePart.countDocuments({
      $expr: { $lt: ['$quantity', '$minimumQuantity'] }
    });

    res.json({
      totalSystems,
      activeSystems,
      systemsInMaintenance,
      openTasks,
      tasksInProgress,
      overdueTasks,
      activeIncidents,
      criticalIncidents,
      totalUsers,
      activeUsers,
      teamMembers,
      lowStockParts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get system status distribution
// @route   GET /api/dashboard/system-status
const getSystemStatusDistribution = async (req, res) => {
  try {
    let match = {};
    if (req.user.role !== 'admin') {
      const user = await User.findById(req.user.id);
      if (user.group) {
        match = { assignedGroup: user.group };
      }
    }

    const distribution = await System.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: null,
          data: {
            $push: {
              status: '$_id',
              count: '$count'
            }
          },
          total: { $sum: '$count' }
        }
      }
    ]);

    res.json(distribution[0] || { data: [], total: 0 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get task overview
// @route   GET /api/dashboard/task-overview
const getTaskOverview = async (req, res) => {
  try {
    let match = {};
    if (req.user.role !== 'admin') {
      match = { assignedTo: req.user.id };
    }

    const overview = await Task.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get tasks by priority
    const byPriority = await Task.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get tasks by type
    const byType = await Task.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$taskType',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      byStatus: overview,
      byPriority,
      byType
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get incident overview
// @route   GET /api/dashboard/incident-overview
const getIncidentOverview = async (req, res) => {
  try {
    let match = {};
    if (req.user.role !== 'admin') {
      const user = await User.findById(req.user.id);
      if (user.group) {
        const systems = await System.find({ assignedGroup: user.group });
        const systemIds = systems.map(s => s._id);
        match = { system: { $in: systemIds } };
      } else {
        match = { $or: [{ reportedBy: req.user.id }, { assignedTo: req.user.id }] };
      }
    }

    const overview = await Incident.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const bySeverity = await Incident.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      }
    ]);

    const byType = await Incident.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$incidentType',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      byStatus: overview,
      bySeverity,
      byType
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get recent activity
// @route   GET /api/dashboard/recent-activity
const getRecentActivity = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Get recent tasks
    let taskMatch = {};
    if (req.user.role !== 'admin') {
      taskMatch = { $or: [{ assignedTo: req.user.id }, { createdBy: req.user.id }] };
    }

    const recentTasks = await Task.find(taskMatch)
      .populate('system', 'name')
      .populate('assignedTo', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Get recent incidents
    let incidentMatch = {};
    if (req.user.role !== 'admin') {
      const user = await User.findById(req.user.id);
      if (user.group) {
        const systems = await System.find({ assignedGroup: user.group });
        const systemIds = systems.map(s => s._id);
        incidentMatch = { system: { $in: systemIds } };
      } else {
        incidentMatch = { $or: [{ reportedBy: req.user.id }, { assignedTo: req.user.id }] };
      }
    }

    const recentIncidents = await Incident.find(incidentMatch)
      .populate('system', 'name')
      .populate('reportedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Get recent systems
    let systemMatch = {};
    if (req.user.role !== 'admin') {
      const user = await User.findById(req.user.id);
      if (user.group) {
        systemMatch = { assignedGroup: user.group };
      }
    }

    const recentSystems = await System.find(systemMatch)
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Combine and sort all activities
    const activities = [
      ...recentTasks.map(t => ({
        type: 'task',
        title: t.title,
        description: `Task "${t.title}" ${t.status}`,
        date: t.createdAt,
        user: t.assignedTo || t.createdBy,
        id: t._id
      })),
      ...recentIncidents.map(i => ({
        type: 'incident',
        title: i.title,
        description: `Incident "${i.title}" ${i.status}`,
        date: i.createdAt,
        user: i.reportedBy,
        id: i._id
      })),
      ...recentSystems.map(s => ({
        type: 'system',
        title: s.name,
        description: `System "${s.name}" created`,
        date: s.createdAt,
        user: s.createdBy,
        id: s._id
      }))
    ];

    activities.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(activities.slice(0, limit));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get performance metrics
// @route   GET /api/dashboard/performance
const getPerformanceMetrics = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let match = {};
    if (req.user.role !== 'admin') {
      const user = await User.findById(req.user.id);
      if (user.group) {
        match = { assignedGroup: user.group };
      }
    }

    // Get system uptime metrics
    const systems = await System.find(match);
    const avgUptime = systems.reduce((acc, s) => acc + (s.metrics?.uptime || 0), 0) / (systems.length || 1);

    // Get task completion rate
    const totalTasks = await Task.countDocuments({
      ...match,
      createdAt: { $gte: thirtyDaysAgo }
    });
    const completedTasks = await Task.countDocuments({
      ...match,
      status: 'completed',
      createdAt: { $gte: thirtyDaysAgo }
    });
    const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Get incident resolution time
    const resolvedIncidents = await Incident.find({
      ...match,
      status: 'resolved',
      resolutionDate: { $gte: thirtyDaysAgo }
    });

    const avgResolutionTime = resolvedIncidents.reduce((acc, i) => {
      const resolutionTime = (i.resolutionDate - i.createdAt) / (1000 * 60 * 60); // hours
      return acc + resolutionTime;
    }, 0) / (resolvedIncidents.length || 1);

    // Get group performance
    const groupPerformance = await Group.aggregate([
      {
        $lookup: {
          from: 'tasks',
          localField: '_id',
          foreignField: 'assignedGroup',
          as: 'tasks'
        }
      },
      {
        $project: {
          name: 1,
          taskCount: { $size: '$tasks' },
          completedTasks: {
            $size: {
              $filter: {
                input: '$tasks',
                as: 'task',
                cond: { $eq: ['$$task.status', 'completed'] }
              }
            }
          }
        }
      }
    ]);

    res.json({
      avgUptime: Math.round(avgUptime * 100) / 100,
      taskCompletionRate: Math.round(taskCompletionRate),
      avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
      groupPerformance
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getSystemStatusDistribution,
  getTaskOverview,
  getIncidentOverview,
  getRecentActivity,
  getPerformanceMetrics
};