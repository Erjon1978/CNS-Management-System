const mongoose = require('mongoose');
const { TASK_TYPES } = require('../config/constants');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  taskType: {
    type: String,
    enum: Object.values(TASK_TYPES),
    required: true
  },
  priority: {
    type: String,
    enum: ['critical', 'high', 'medium', 'low'],
    default: 'medium'
  },
  urgency: {
    type: String,
    enum: ['immediate', 'today', 'this_week', 'this_month', 'scheduled'],
    default: 'scheduled'
  },
  safetyImpact: {
    type: String,
    enum: ['none', 'minor', 'significant', 'critical'],
    default: 'none'
  },
  atsImpact: {
    type: String,
    enum: ['none', 'local', 'regional', 'national'],
    default: 'none'
  },
  system: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'System',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedGroup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['draft', 'pending_approval', 'approved', 'in_progress', 'awaiting_part', 'completed', 'cancelled', 'on_hold'],
    default: 'draft'
  },
  scheduleType: {
    type: String,
    enum: ['one_time', 'recursive', 'on_condition'],
    default: 'one_time'
  },
  recursivePattern: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'biannual', 'annual']
    },
    interval: Number,
    dayOfWeek: Number,
    dayOfMonth: Number,
    startDate: Date,
    endDate: Date,
    nextOccurrence: Date
  },
  conditionBased: {
    triggerType: {
      type: String,
      enum: ['time_since_last', 'cycles', 'alarm', 'performance_degradation']
    },
    threshold: Number,
    unit: String
  },
  startDate: Date,
  dueDate: Date,
  estimatedDuration: Number,
  actualDuration: Number,
  requiredCertifications: [{
    type: String,
    enum: ['electrical', 'mechanical', 'electronics', 'software', 'safety', 'radar', 'navigation', 'communication']
  }],
  requiredTooling: [String],
  completionNotes: String,
  attachments: [{
    name: String,
    url: String,
    type: String,
    uploadedAt: Date
  }],
  checklist: [{
    item: String,
    completed: Boolean,
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    completedAt: Date,
    notes: String
  }],
  completionReport: {
    reportNumber: String,
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    submittedAt: Date,
    summary: String,
    recommendations: String
  },
  completedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
taskSchema.index({ system: 1, status: 1 });
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ dueDate: 1, priority: 1 });
taskSchema.index({ 'recursivePattern.nextOccurrence': 1 });

module.exports = mongoose.model('Task', taskSchema);