const mongoose = require('mongoose');
const { SYSTEM_TYPES, SYSTEM_STATUS, SERVICE_LEVELS } = require('../config/constants');

// Get all system type values
const systemTypeValues = Object.values(SYSTEM_TYPES);
const systemStatusValues = Object.values(SYSTEM_STATUS);
const serviceLevelValues = Object.values(SERVICE_LEVELS);

const systemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  systemType: {
    type: String,
    enum: systemTypeValues,
    required: true
  },
  subsystem: {
    type: String,
    required: true
  },
  serialNumber: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  manufacturer: {
    type: String,
    required: true
  },
  model: {
    type: String,
    required: true
  },
  firmwareVersion: String,
  softwareVersion: String,
  hardwareVersion: String,
  installationDate: Date,
  commissionDate: Date,
  lastCalibrationDate: Date,
  nextCalibrationDate: Date,
  expectedLifespan: Number,
  location: {
    site: {
      type: String,
      required: true
    },
    building: String,
    room: String,
    rack: String,
    slot: String,
    coordinates: {
      latitude: Number,
      longitude: Number,
      elevation: Number
    }
  },
  status: {
    type: String,
    enum: systemStatusValues,
    default: SYSTEM_STATUS.OPERATIONAL
  },
  serviceLevel: {
    type: String,
    enum: serviceLevelValues,
    default: SERVICE_LEVELS.ESSENTIAL
  },
  configuration: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: new Map()
  },
  networkConnections: [{
    connectedSystem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'System'
    },
    connectionType: {
      type: String,
      enum: ['serial', 'ethernet', 'fiber', 'wireless', 'coax', 'usb']
    },
    protocol: String,
    interface: String,
    cableType: String,
    length: Number
  }],
  powerSupply: {
    type: String,
    enum: ['mains', 'redundant', 'battery', 'generator', 'ups'],
    default: 'mains'
  },
  redundancyLevel: {
    type: String,
    enum: ['none', 'local', 'site', 'regional', 'global'],
    default: 'none'
  },
  criticality: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  atsImpact: {
    type: String,
    enum: ['none', 'local', 'regional', 'national'],
    default: 'local'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedGroup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  },
  spareParts: [{
    part: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SparePart'
    },
    quantity: Number,
    location: String,
    minimumStock: {
      type: Number,
      default: 1
    },
    reorderPoint: Number
  }],
  documentation: [{
    title: String,
    type: {
      type: String,
      enum: ['manual', 'diagram', 'configuration', 'procedure', 'certificate', 'compliance']
    },
    url: String,
    version: String,
    uploadDate: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  maintenanceHistory: [{
    date: {
      type: Date,
      default: Date.now
    },
    type: {
      type: String,
      enum: ['preventive', 'corrective', 'predictive', 'emergency']
    },
    description: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    duration: Number,
    result: String,
    followUpNeeded: Boolean
  }],
  metrics: {
    uptime: {
      type: Number,
      default: 100
    },
    meanTimeBetweenFailures: Number,
    meanTimeToRepair: Number,
    totalIncidents: {
      type: Number,
      default: 0
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Virtual for age
systemSchema.virtual('age').get(function() {
  if (!this.installationDate) return null;
  return Math.floor((Date.now() - this.installationDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
});

// Indexes
systemSchema.index({ systemType: 1, subsystem: 1 });
systemSchema.index({ 'location.site': 1 });
systemSchema.index({ status: 1, serviceLevel: 1 });

module.exports = mongoose.model('System', systemSchema);