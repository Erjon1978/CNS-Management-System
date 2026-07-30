const SystemType = require('../models/SystemType');
const Certification = require('../models/Certification');
const System = require('../models/System');
const Group = require('../models/Group');
const User = require('../models/User');

// ==================== SYSTEM TYPES ====================

// @desc    Get all system types (with their subsystems)
// @route   GET /api/config/system-types
const getSystemTypes = async (req, res) => {
  try {
    const systemTypes = await SystemType.find().sort({ label: 1 });
    res.json(systemTypes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a system type
// @route   POST /api/config/system-types
const createSystemType = async (req, res) => {
  try {
    const { value, label, subsystems } = req.body;

    if (!value || !label) {
      return res.status(400).json({ message: 'Value and label are required' });
    }

    const existing = await SystemType.findOne({ value: value.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: 'A system type with this value already exists' });
    }

    const systemType = await SystemType.create({
      value: value.toLowerCase(),
      label,
      subsystems: subsystems || []
    });

    res.status(201).json(systemType);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a system type's label (and optionally replace its subsystems list)
// @route   PUT /api/config/system-types/:id
const updateSystemType = async (req, res) => {
  try {
    const { label, subsystems } = req.body;
    const systemType = await SystemType.findById(req.params.id);

    if (!systemType) {
      return res.status(404).json({ message: 'System type not found' });
    }

    if (label !== undefined) systemType.label = label;
    if (subsystems !== undefined) systemType.subsystems = subsystems;

    await systemType.save();
    res.json(systemType);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a system type
// @route   DELETE /api/config/system-types/:id
const deleteSystemType = async (req, res) => {
  try {
    const systemType = await SystemType.findById(req.params.id);
    if (!systemType) {
      return res.status(404).json({ message: 'System type not found' });
    }

    const [systemsInUse, groupsInUse] = await Promise.all([
      System.countDocuments({ systemType: systemType.value }),
      Group.countDocuments({ responsibleSystemTypes: systemType.value })
    ]);

    if (systemsInUse > 0 || groupsInUse > 0) {
      return res.status(400).json({
        message: `Cannot delete: this system type is used by ${systemsInUse} system(s) and ${groupsInUse} group(s)`
      });
    }

    await systemType.deleteOne();
    res.json({ message: 'System type deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a subsystem to a system type
// @route   POST /api/config/system-types/:id/subsystems
const addSubsystem = async (req, res) => {
  try {
    const { value, label } = req.body;
    if (!value || !label) {
      return res.status(400).json({ message: 'Value and label are required' });
    }

    const systemType = await SystemType.findById(req.params.id);
    if (!systemType) {
      return res.status(404).json({ message: 'System type not found' });
    }

    const normalizedValue = value.toLowerCase();
    if (systemType.subsystems.some(s => s.value === normalizedValue)) {
      return res.status(400).json({ message: 'A subsystem with this value already exists on this system type' });
    }

    systemType.subsystems.push({ value: normalizedValue, label });
    await systemType.save();
    res.status(201).json(systemType);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a subsystem
// @route   PUT /api/config/system-types/:id/subsystems/:subId
const updateSubsystem = async (req, res) => {
  try {
    const { label } = req.body;
    const systemType = await SystemType.findById(req.params.id);
    if (!systemType) {
      return res.status(404).json({ message: 'System type not found' });
    }

    const subsystem = systemType.subsystems.id(req.params.subId);
    if (!subsystem) {
      return res.status(404).json({ message: 'Subsystem not found' });
    }

    if (label !== undefined) subsystem.label = label;
    await systemType.save();
    res.json(systemType);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a subsystem
// @route   DELETE /api/config/system-types/:id/subsystems/:subId
const deleteSubsystem = async (req, res) => {
  try {
    const systemType = await SystemType.findById(req.params.id);
    if (!systemType) {
      return res.status(404).json({ message: 'System type not found' });
    }

    const subsystem = systemType.subsystems.id(req.params.subId);
    if (!subsystem) {
      return res.status(404).json({ message: 'Subsystem not found' });
    }

    const systemsInUse = await System.countDocuments({
      systemType: systemType.value,
      subsystem: subsystem.value
    });

    if (systemsInUse > 0) {
      return res.status(400).json({
        message: `Cannot delete: this subsystem is used by ${systemsInUse} system(s)`
      });
    }

    subsystem.deleteOne();
    await systemType.save();
    res.json(systemType);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== CERTIFICATIONS ====================

// @desc    Get all certifications
// @route   GET /api/config/certifications
const getCertifications = async (req, res) => {
  try {
    const certifications = await Certification.find().sort({ label: 1 });
    res.json(certifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a certification
// @route   POST /api/config/certifications
const createCertification = async (req, res) => {
  try {
    const { value, label } = req.body;
    if (!value || !label) {
      return res.status(400).json({ message: 'Value and label are required' });
    }

    const existing = await Certification.findOne({ value: value.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: 'A certification with this value already exists' });
    }

    const certification = await Certification.create({ value: value.toLowerCase(), label });
    res.status(201).json(certification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a certification's label
// @route   PUT /api/config/certifications/:id
const updateCertification = async (req, res) => {
  try {
    const { label } = req.body;
    const certification = await Certification.findById(req.params.id);
    if (!certification) {
      return res.status(404).json({ message: 'Certification not found' });
    }

    if (label !== undefined) certification.label = label;
    await certification.save();
    res.json(certification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a certification
// @route   DELETE /api/config/certifications/:id
const deleteCertification = async (req, res) => {
  try {
    const certification = await Certification.findById(req.params.id);
    if (!certification) {
      return res.status(404).json({ message: 'Certification not found' });
    }

    const [usersInUse, groupsInUse] = await Promise.all([
      User.countDocuments({ certifications: certification.value }),
      Group.countDocuments({ certifications: certification.value })
    ]);

    if (usersInUse > 0 || groupsInUse > 0) {
      return res.status(400).json({
        message: `Cannot delete: this certification is used by ${usersInUse} user(s) and ${groupsInUse} group(s)`
      });
    }

    await certification.deleteOne();
    res.json({ message: 'Certification deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSystemTypes,
  createSystemType,
  updateSystemType,
  deleteSystemType,
  addSubsystem,
  updateSubsystem,
  deleteSubsystem,
  getCertifications,
  createCertification,
  updateCertification,
  deleteCertification
};
