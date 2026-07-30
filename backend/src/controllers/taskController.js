const Task = require('../models/Task');
const System = require('../models/System');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

// @desc    Create task
// @route   POST /api/tasks
const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      taskType,
      priority,
      urgency,
      safetyImpact,
      atsImpact,
      system,
      assignedTo,
      assignedGroup,
      scheduleType,
      recursivePattern,
      startDate,
      dueDate,
      estimatedDuration,
      requiredCertifications,
      requiredTooling,
      checklist
    } = req.body;

    // Verify system exists and user has access
    const systemDoc = await System.findById(system);
    if (!systemDoc) {
      return res.status(404).json({ message: 'System not found' });
    }

    // Check if assigned user has required certifications
    if (assignedTo) {
      const user = await User.findById(assignedTo);
      if (requiredCertifications && requiredCertifications.length > 0) {
        const hasAllCerts = requiredCertifications.every(cert => 
          user.certifications.includes(cert)
        );
        if (!hasAllCerts) {
          return res.status(403).json({ 
            message: 'Assigned user does not have required certifications' 
          });
        }
      }
    }

    const task = await Task.create({
      title,
      description,
      taskType,
      priority,
      urgency,
      safetyImpact,
      atsImpact,
      system,
      assignedTo,
      assignedGroup,
      createdBy: req.user.id,
      scheduleType,
      recursivePattern,
      startDate,
      dueDate,
      estimatedDuration,
      requiredCertifications,
      requiredTooling,
      checklist: checklist || [],
      status: 'pending_approval'
    });

    await ActivityLog.create({
      user: req.user.id,
      action: 'TASK_CREATED',
      task: task._id,
      details: `Task "${title}" created for system ${systemDoc.name}`,
      ipAddress: req.ip
    });

    req.app.get('io').emit('task_created', task);

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get tasks with filters
// @route   GET /api/tasks
const getTasks = async (req, res) => {
  try {
    const {
      status,
      priority,
      assignedTo,
      system,
      taskType,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;

    let query = {};

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo;
    if (system) query.system = system;
    if (taskType) query.taskType = taskType;
    if (startDate) query.startDate = { $gte: new Date(startDate) };
    if (endDate) query.dueDate = { $lte: new Date(endDate) };

    // Filter by user access
    if (req.user.role !== 'admin') {
      const user = await User.findById(req.user.id);
      if (user.group) {
        query.assignedGroup = user.group;
      } else {
        query.$or = [
          { assignedTo: req.user.id },
          { createdBy: req.user.id }
        ];
      }
    }

    const skip = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
      Task.find(query)
        .populate('system', 'name systemType serialNumber')
        .populate('assignedTo', 'firstName lastName username')
        .populate('assignedGroup', 'name')
        .populate('createdBy', 'firstName lastName')
        .skip(skip)
        .limit(limit)
        .sort({ dueDate: 1, priority: -1 }),
      Task.countDocuments(query)
    ]);

    res.json({
      tasks,
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

// @desc    Get task by ID
// @route   GET /api/tasks/:id
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('system', 'name systemType serialNumber location')
      .populate('assignedTo', 'firstName lastName username certifications')
      .populate('assignedGroup', 'name')
      .populate('createdBy', 'firstName lastName')
      .populate('approvedBy', 'firstName lastName')
      .populate('completionReport.submittedBy', 'firstName lastName');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Only manager or creator can update
    if (req.user.role !== 'admin' && 
        task.createdBy.toString() !== req.user.id &&
        req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    await ActivityLog.create({
      user: req.user.id,
      action: 'TASK_UPDATED',
      task: task._id,
      details: `Task "${task.title}" updated`,
      ipAddress: req.ip
    });

    req.app.get('io').emit('task_updated', updatedTask);

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update task status
// @route   PATCH /api/tasks/:id/status
const updateTaskStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.status = status;
    if (status === 'completed') {
      task.completedAt = Date.now();
    }
    await task.save();

    await ActivityLog.create({
      user: req.user.id,
      action: 'TASK_STATUS_CHANGED',
      task: task._id,
      details: `Task "${task.title}" status changed to ${status}`,
      ipAddress: req.ip,
      metadata: { notes }
    });

    req.app.get('io').emit('task_status_changed', task);

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get task statistics
// @route   GET /api/tasks/stats
const getTaskStats = async (req, res) => {
  try {
    const stats = await Task.aggregate([
      {
        $group: {
          _id: {
            status: '$status',
            priority: '$priority'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.status',
          priorities: {
            $push: {
              priority: '$_id.priority',
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

// @desc    Delete task
// @route   DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await task.deleteOne();

    await ActivityLog.create({
      user: req.user.id,
      action: 'TASK_DELETED',
      details: `Task "${task.title}" deleted`,
      ipAddress: req.ip
    });

    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask,
  getTaskStats
};