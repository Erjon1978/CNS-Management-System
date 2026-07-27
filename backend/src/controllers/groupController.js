const Group = require('../models/Group');
const User = require('../models/User');
const System = require('../models/System');
const ActivityLog = require('../models/ActivityLog');

// @desc    Create group
// @route   POST /api/groups
const createGroup = async (req, res) => {
  try {
    const {
      name,
      description,
      responsibleSystemTypes,
      teamLead,
      members,
      certifications,
      shiftSchedule
    } = req.body;

    const existingGroup = await Group.findOne({ name });
    if (existingGroup) {
      return res.status(400).json({ message: 'Group name already exists' });
    }

    const group = await Group.create({
      name,
      description,
      responsibleSystemTypes: responsibleSystemTypes || [],
      teamLead,
      members: members || [],
      certifications: certifications || [],
      shiftSchedule
    });

    // Update team lead's group if assigned
    if (teamLead) {
      await User.findByIdAndUpdate(teamLead, { group: group._id });
    }

    // Update members' group
    if (members && members.length > 0) {
      await User.updateMany(
        { _id: { $in: members } },
        { group: group._id }
      );
    }

    await ActivityLog.create({
      user: req.user.id,
      action: 'GROUP_CREATED',
      details: `Group "${name}" created`,
      ipAddress: req.ip
    });

    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get groups with filters
// @route   GET /api/groups
const getGroups = async (req, res) => {
  try {
    const { responsibleSystemType, search, page = 1, limit = 20 } = req.query;

    let query = {};
    if (responsibleSystemType) query.responsibleSystemTypes = responsibleSystemType;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [groups, total] = await Promise.all([
      Group.find(query)
        .populate('teamLead', 'firstName lastName username email')
        .populate('members', 'firstName lastName username')
        .populate('assignedSystems', 'name systemType')
        .skip(skip)
        .limit(limit)
        .sort({ name: 1 }),
      Group.countDocuments(query)
    ]);

    res.json({
      groups,
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

// @desc    Get group by ID
// @route   GET /api/groups/:id
const getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('teamLead', 'firstName lastName username email')
      .populate('members', 'firstName lastName username email certifications')
      .populate('assignedSystems', 'name systemType serialNumber status');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update group
// @route   PUT /api/groups/:id
const updateGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const updatedGroup = await Group.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    await ActivityLog.create({
      user: req.user.id,
      action: 'GROUP_UPDATED',
      details: `Group "${group.name}" updated`,
      ipAddress: req.ip
    });

    res.json(updatedGroup);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete group
// @route   DELETE /api/groups/:id
const deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Remove group from all members
    await User.updateMany(
      { group: group._id },
      { $unset: { group: '' } }
    );

    await group.deleteOne();

    await ActivityLog.create({
      user: req.user.id,
      action: 'GROUP_DELETED',
      details: `Group "${group.name}" deleted`,
      ipAddress: req.ip
    });

    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add member to group
// @route   POST /api/groups/:id/members
const addMemberToGroup = async (req, res) => {
  try {
    const { userId } = req.body;
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (group.members.includes(userId)) {
      return res.status(400).json({ message: 'User is already a member of this group' });
    }

    group.members.push(userId);
    await group.save();

    user.group = group._id;
    await user.save();

    await ActivityLog.create({
      user: req.user.id,
      action: 'GROUP_MEMBER_ADDED',
      details: `User "${user.username}" added to group "${group.name}"`,
      ipAddress: req.ip
    });

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove member from group
// @route   DELETE /api/groups/:id/members/:userId
const removeMemberFromGroup = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const group = await Group.findById(id);
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    group.members = group.members.filter(m => m.toString() !== userId);
    await group.save();

    user.group = null;
    await user.save();

    await ActivityLog.create({
      user: req.user.id,
      action: 'GROUP_MEMBER_REMOVED',
      details: `User "${user.username}" removed from group "${group.name}"`,
      ipAddress: req.ip
    });

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Assign system to group
// @route   POST /api/groups/:id/systems
const assignSystemToGroup = async (req, res) => {
  try {
    const { systemId } = req.body;
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const system = await System.findById(systemId);
    if (!system) {
      return res.status(404).json({ message: 'System not found' });
    }

    if (group.assignedSystems.includes(systemId)) {
      return res.status(400).json({ message: 'System is already assigned to this group' });
    }

    group.assignedSystems.push(systemId);
    await group.save();

    system.assignedGroup = group._id;
    await system.save();

    await ActivityLog.create({
      user: req.user.id,
      action: 'GROUP_SYSTEM_ASSIGNED',
      details: `System "${system.name}" assigned to group "${group.name}"`,
      ipAddress: req.ip
    });

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove system from group
// @route   DELETE /api/groups/:id/systems/:systemId
const removeSystemFromGroup = async (req, res) => {
  try {
    const { id, systemId } = req.params;
    const group = await Group.findById(id);
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const system = await System.findById(systemId);
    if (!system) {
      return res.status(404).json({ message: 'System not found' });
    }

    group.assignedSystems = group.assignedSystems.filter(s => s.toString() !== systemId);
    await group.save();

    system.assignedGroup = null;
    await system.save();

    await ActivityLog.create({
      user: req.user.id,
      action: 'GROUP_SYSTEM_REMOVED',
      details: `System "${system.name}" removed from group "${group.name}"`,
      ipAddress: req.ip
    });

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get group statistics
// @route   GET /api/groups/stats
const getGroupStats = async (req, res) => {
  try {
    const stats = await Group.aggregate([
      { $unwind: { path: '$responsibleSystemTypes', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$responsibleSystemTypes',
          count: { $sum: 1 },
          totalMembers: { $sum: { $size: '$members' } },
          totalSystems: { $sum: { $size: '$assignedSystems' } }
        }
      }
    ]);

    const totalGroups = await Group.countDocuments();

    res.json({
      total: totalGroups,
      byType: stats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
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
};