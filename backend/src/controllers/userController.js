const User = require('../models/User');
const Group = require('../models/Group');
const ActivityLog = require('../models/ActivityLog');
const bcrypt = require('bcryptjs');

// @desc    Get users with filters
// @route   GET /api/users
const getUsers = async (req, res) => {
  try {
    const {
      role,
      group,
      search,
      isActive,
      page = 1,
      limit = 20
    } = req.query;

    let query = {};

    if (role) query.role = role;
    if (group) query.group = group;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(query)
        .populate('group', 'name type')
        .select('-password')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      User.countDocuments(query)
    ]);

    res.json({
      users,
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

// @desc    Get user by ID
// @route   GET /api/users/:id
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('group', 'name type')
      .select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Don't allow updating password here
    delete req.body.password;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).select('-password');

    await ActivityLog.create({
      user: req.user.id,
      action: 'USER_UPDATED',
      details: `User "${user.username}" updated`,
      ipAddress: req.ip
    });

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Don't allow deleting self
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    await user.deleteOne();

    await ActivityLog.create({
      user: req.user.id,
      action: 'USER_DELETED',
      details: `User "${user.username}" deleted`,
      ipAddress: req.ip
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle user status
// @route   PATCH /api/users/:id/toggle-status
const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = !user.isActive;
    await user.save();

    await ActivityLog.create({
      user: req.user.id,
      action: 'USER_STATUS_TOGGLED',
      details: `User "${user.username}" ${user.isActive ? 'activated' : 'deactivated'}`,
      ipAddress: req.ip
    });

    res.json({ 
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: user.isActive
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Assign user to group
// @route   PATCH /api/users/:id/group
const assignUserToGroup = async (req, res) => {
  try {
    const { groupId } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (groupId) {
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ message: 'Group not found' });
      }
    }

    user.group = groupId || null;
    await user.save();

    await ActivityLog.create({
      user: req.user.id,
      action: 'USER_GROUP_ASSIGNED',
      details: `User "${user.username}" assigned to group ${groupId || 'none'}`,
      ipAddress: req.ip
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add certification to user
// @route   POST /api/users/:id/certifications
const addCertification = async (req, res) => {
  try {
    const { certification, expiryDate, issuedDate, issuedBy, certificateNumber } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.certifications.includes(certification)) {
      user.certifications.push(certification);
    }

    user.certificationsExpiry.push({
      certification,
      expiryDate: expiryDate || null,
      issuedDate: issuedDate || new Date(),
      issuedBy,
      certificateNumber
    });

    await user.save();

    await ActivityLog.create({
      user: req.user.id,
      action: 'CERTIFICATION_ADDED',
      details: `Certification "${certification}" added to user "${user.username}"`,
      ipAddress: req.ip
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove certification from user
// @route   DELETE /api/users/:id/certifications/:certification
const removeCertification = async (req, res) => {
  try {
    const { certification } = req.params;
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.certifications = user.certifications.filter(c => c !== certification);
    user.certificationsExpiry = user.certificationsExpiry.filter(
      c => c.certification !== certification
    );

    await user.save();

    await ActivityLog.create({
      user: req.user.id,
      action: 'CERTIFICATION_REMOVED',
      details: `Certification "${certification}" removed from user "${user.username}"`,
      ipAddress: req.ip
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add training to user
// @route   POST /api/users/:id/trainings
const addTraining = async (req, res) => {
  try {
    const { name, provider, date, expiryDate, certificate, type } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.trainings.push({
      name,
      provider,
      date,
      expiryDate,
      certificate,
      type
    });

    await user.save();

    await ActivityLog.create({
      user: req.user.id,
      action: 'TRAINING_ADDED',
      details: `Training "${name}" added to user "${user.username}"`,
      ipAddress: req.ip
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add vacation to user
// @route   POST /api/users/:id/vacation
const addVacation = async (req, res) => {
  try {
    const { startDate, endDate, type, notes } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.vacationDays.push({
      startDate,
      endDate,
      type,
      notes,
      status: 'pending'
    });

    await user.save();

    await ActivityLog.create({
      user: req.user.id,
      action: 'VACATION_ADDED',
      details: `Vacation added for user "${user.username}" from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`,
      ipAddress: req.ip
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add extra hours to user
// @route   POST /api/users/:id/extra-hours
const addExtraHours = async (req, res) => {
  try {
    const { date, hours, description, type } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.extraHours.push({
      date,
      hours,
      description,
      type,
      approved: false
    });

    await user.save();

    await ActivityLog.create({
      user: req.user.id,
      action: 'EXTRA_HOURS_ADDED',
      details: `${hours} extra hours added for user "${user.username}"`,
      ipAddress: req.ip
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user statistics
// @route   GET /api/users/stats
const getUserStats = async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          active: {
            $sum: { $cond: ['$isActive', 1, 0] }
          },
          inactive: {
            $sum: { $cond: ['$isActive', 0, 1] }
          }
        }
      }
    ]);

    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });

    res.json({
      total: totalUsers,
      active: activeUsers,
      inactive: totalUsers - activeUsers,
      byRole: stats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
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
};