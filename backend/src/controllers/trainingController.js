const Training = require('../models/Training');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

// @desc    Create training
// @route   POST /api/trainings
const createTraining = async (req, res) => {
  try {
    const trainingData = {
      ...req.body,
      createdBy: req.user.id
    };

    const training = await Training.create(trainingData);

    await ActivityLog.create({
      user: req.user.id,
      action: 'TRAINING_CREATED',
      details: `Training "${training.name}" created`,
      ipAddress: req.ip
    });

    res.status(201).json(training);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get trainings with filters
// @route   GET /api/trainings
const getTrainings = async (req, res) => {
  try {
    const {
      type,
      category,
      status,
      department,
      search,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;

    let query = {};

    if (type) query.type = type;
    if (category) query.category = category;
    if (status) query.status = status;
    if (department) query.department = department;
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { provider: { $regex: search, $options: 'i' } }
      ];
    }

    if (startDate || endDate) {
      query['schedule.startDate'] = {};
      if (startDate) query['schedule.startDate'].$gte = new Date(startDate);
      if (endDate) query['schedule.startDate'].$lte = new Date(endDate);
    }

    // Filter by user access
    if (req.user.role !== 'admin') {
      const user = await User.findById(req.user.id);
      if (user.department) {
        query.$or = [
          { department: user.department },
          { department: 'all' }
        ];
      }
    }

    const skip = (page - 1) * limit;

    const [trainings, total] = await Promise.all([
      Training.find(query)
        .populate('attendees.user', 'firstName lastName username email')
        .populate('createdBy', 'firstName lastName')
        .populate('attendees.approvedBy', 'firstName lastName')
        .skip(skip)
        .limit(limit)
        .sort({ 'schedule.startDate': 1 }),
      Training.countDocuments(query)
    ]);

    res.json({
      trainings,
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

// @desc    Get training by ID
// @route   GET /api/trainings/:id
const getTrainingById = async (req, res) => {
  try {
    const training = await Training.findById(req.params.id)
      .populate('attendees.user', 'firstName lastName username email certifications')
      .populate('createdBy', 'firstName lastName')
      .populate('attendees.approvedBy', 'firstName lastName');

    if (!training) {
      return res.status(404).json({ message: 'Training not found' });
    }

    res.json(training);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update training
// @route   PUT /api/trainings/:id
const updateTraining = async (req, res) => {
  try {
    const training = await Training.findById(req.params.id);
    if (!training) {
      return res.status(404).json({ message: 'Training not found' });
    }

    // Only manager or creator can update
    if (req.user.role !== 'admin' && 
        training.createdBy.toString() !== req.user.id &&
        req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedTraining = await Training.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    await ActivityLog.create({
      user: req.user.id,
      action: 'TRAINING_UPDATED',
      details: `Training "${training.name}" updated`,
      ipAddress: req.ip
    });

    res.json(updatedTraining);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete training
// @route   DELETE /api/trainings/:id
const deleteTraining = async (req, res) => {
  try {
    const training = await Training.findById(req.params.id);
    if (!training) {
      return res.status(404).json({ message: 'Training not found' });
    }

    await training.deleteOne();

    await ActivityLog.create({
      user: req.user.id,
      action: 'TRAINING_DELETED',
      details: `Training "${training.name}" deleted`,
      ipAddress: req.ip
    });

    res.json({ message: 'Training deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Register for training
// @route   POST /api/trainings/:id/register
const registerForTraining = async (req, res) => {
  try {
    const training = await Training.findById(req.params.id);
    if (!training) {
      return res.status(404).json({ message: 'Training not found' });
    }

    if (training.status !== 'scheduled') {
      return res.status(400).json({ message: 'Training is not open for registration' });
    }

    await training.registerUser(req.user.id);

    await ActivityLog.create({
      user: req.user.id,
      action: 'TRAINING_REGISTERED',
      details: `Registered for training "${training.name}"`,
      ipAddress: req.ip
    });

    res.json({ message: 'Successfully registered for training' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Mark attendance
// @route   PATCH /api/trainings/:id/attendance
const markAttendance = async (req, res) => {
  try {
    const { userId, status, score, feedback } = req.body;
    const training = await Training.findById(req.params.id);
    
    if (!training) {
      return res.status(404).json({ message: 'Training not found' });
    }

    // Only manager or admin can mark attendance
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const attendee = training.attendees.find(a => a.user.toString() === userId);
    if (!attendee) {
      return res.status(404).json({ message: 'User not registered for this training' });
    }

    attendee.attendanceStatus = status;
    if (status === 'completed') {
      attendee.completed = true;
      attendee.completionDate = new Date();
    }
    if (score) attendee.score = score;
    if (feedback) attendee.feedback = feedback;

    await training.save();

    // If training is completed, update user's certifications if applicable
    if (status === 'completed' && training.certification && training.certification !== 'none') {
      const user = await User.findById(userId);
      if (!user.certifications.includes(training.certification)) {
        user.certifications.push(training.certification);
        await user.save();
      }
    }

    await ActivityLog.create({
      user: req.user.id,
      action: 'TRAINING_ATTENDANCE',
      details: `Attendance marked for user ${userId} in training "${training.name}"`,
      ipAddress: req.ip
    });

    res.json({ message: 'Attendance marked successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get upcoming trainings
// @route   GET /api/trainings/upcoming
const getUpcomingTrainings = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const trainings = await Training.getUpcoming(days)
      .populate('attendees.user', 'firstName lastName');

    res.json(trainings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get training statistics
// @route   GET /api/trainings/stats
const getTrainingStats = async (req, res) => {
  try {
    const stats = await Training.aggregate([
      {
        $group: {
          _id: {
            type: '$type',
            status: '$status'
          },
          count: { $sum: 1 },
          totalAttendees: { $sum: { $size: '$attendees' } }
        }
      },
      {
        $group: {
          _id: '$_id.type',
          stats: {
            $push: {
              status: '$_id.status',
              count: '$count',
              attendees: '$totalAttendees'
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
  createTraining,
  getTrainings,
  getTrainingById,
  updateTraining,
  deleteTraining,
  registerForTraining,
  markAttendance,
  getUpcomingTrainings,
  getTrainingStats
};