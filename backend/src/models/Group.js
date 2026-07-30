const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: String,
  responsibleSystemTypes: [{
    type: String
  }],
  teamLead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  certifications: [{
    type: String
  }],
  shiftSchedule: {
    startTime: String,
    endTime: String,
    daysOfWeek: [Number],
    rotationPattern: String
  },
  assignedSystems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'System'
  }],
  performanceMetrics: {
    tasksCompleted: {
      type: Number,
      default: 0
    },
    averageResponseTime: Number,
    incidentsResolved: {
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

// Index
groupSchema.index({ responsibleSystemTypes: 1 });
groupSchema.index({ 'certifications': 1 });

module.exports = mongoose.model('Group', groupSchema);