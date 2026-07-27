const mongoose = require('mongoose');
const { INCIDENT_TYPES } = require('../config/constants');

const incidentSchema = new mongoose.Schema({
  incidentNumber: {
    type: String,
    unique: true
  },
  system: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'System',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  incidentType: {
    type: String,
    enum: Object.values(INCIDENT_TYPES),
    required: true
  },
  severity: {
    type: String,
    enum: ['critical', 'high', 'medium', 'low'],
    default: 'medium'
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['reported', 'investigating', 'in_progress', 'resolved', 'closed', 'escalated'],
    default: 'reported'
  },
  reportedAt: {
    type: Date,
    default: Date.now
  },
  detectedAt: Date,
  serviceImpact: {
    startTime: Date,
    endTime: Date,
    duration: Number,
    systemsAffected: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'System'
    }],
    atsImpact: {
      type: String,
      enum: ['none', 'local', 'regional', 'national'],
      default: 'none'
    }
  },
  rootCause: {
    category: {
      type: String,
      enum: ['hardware', 'software', 'environmental', 'human_error', 'unknown']
    },
    description: String,
    confirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    confirmedAt: Date
  },
  solution: {
    description: String,
    implementedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    implementedAt: Date,
    verificationMethod: String,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  sparesUsed: [{
    part: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SparePart'
    },
    quantity: Number,
    cost: Number,
    serialNumber: String
  }],
  actionsTaken: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    action: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String
  }],
  lessonsLearned: String,
  preventiveActions: String,
  classification: {
    type: String,
    enum: ['incident', 'accident', 'near_miss'],
    default: 'incident'
  },
  attachments: [{
    name: String,
    url: String,
    type: String,
    uploadedAt: Date
  }],
  resolutionDate: Date,
  downtime: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Generate incident number before save
incidentSchema.pre('save', async function() {
  // If incidentNumber already exists, skip
  if (this.incidentNumber) {
    return;
  }

  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');

  // Count existing incidents for this month
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  const count = await mongoose.model('Incident').countDocuments({
    createdAt: {
      $gte: startOfMonth,
      $lte: endOfMonth
    }
  });

  this.incidentNumber = `ATC-${year}${month}-${String(count + 1).padStart(4, '0')}`;
});

// Remove duplicate indexes - keep only one set
incidentSchema.index({ system: 1, status: 1 });
incidentSchema.index({ reportedAt: 1, severity: 1 });

module.exports = mongoose.model('Incident', incidentSchema);