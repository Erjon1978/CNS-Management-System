const mongoose = require('mongoose');

const trainingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  provider: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['technical', 'safety', 'regulatory', 'soft_skills', 'certification', 'initial', 'recurrent', 'refresher', 'specialized'],
    required: true
  },
  category: {
    type: String,
    enum: ['electrical', 'mechanical', 'electronics', 'software', 'safety', 'radar', 'navigation', 'communication', 'general'],
    default: 'general'
  },
  duration: {
    hours: Number,
    days: Number,
    weeks: Number
  },
  cost: {
    amount: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  },
  certification: {
    type: String,
    enum: ['electrical', 'mechanical', 'electronics', 'software', 'safety', 'radar', 'navigation', 'communication', 'none'],
    default: 'none'
  },
  certificationValidity: {
    type: Number, // in months
    default: 12
  },
  prerequisites: [{
    type: String
  }],
  maxAttendees: {
    type: Number,
    default: 20
  },
  attendees: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    completed: {
      type: Boolean,
      default: false
    },
    completionDate: Date,
    score: {
      type: Number,
      min: 0,
      max: 100
    },
    certificateUrl: String,
    certificateNumber: String,
    feedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comments: String
    },
    attendanceStatus: {
      type: String,
      enum: ['registered', 'attended', 'absent', 'completed'],
      default: 'registered'
    }
  }],
  schedule: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    location: {
      type: String,
      trim: true
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    virtualMeeting: {
      platform: String,
      url: String,
      meetingId: String,
      password: String
    }
  },
  instructor: {
    name: String,
    email: String,
    phone: String,
    bio: String
  },
  materials: [{
    name: String,
    type: {
      type: String,
      enum: ['document', 'video', 'presentation', 'link', 'other']
    },
    url: String,
    description: String
  }],
  assessment: {
    type: {
      type: String,
      enum: ['quiz', 'exam', 'practical', 'project', 'none'],
      default: 'none'
    },
    passingScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 70
    },
    questions: [{
      question: String,
      type: {
        type: String,
        enum: ['multiple_choice', 'true_false', 'essay', 'practical']
      },
      options: [String],
      correctAnswer: String,
      points: Number
    }]
  },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'postponed'],
    default: 'scheduled'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  department: {
    type: String,
    enum: ['cns_communication', 'cns_navigation', 'cns_surveillance', 'atm_data', 'meteorological', 'all'],
    default: 'all'
  },
  tags: [{
    type: String
  }],
  isMandatory: {
    type: Boolean,
    default: false
  },
  isExternal: {
    type: Boolean,
    default: false
  },
  externalProvider: {
    name: String,
    contactPerson: String,
    contactEmail: String,
    contactPhone: String
  },
  budgetCode: String,
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// ==================== PRE-SAVE HOOKS ====================

// Pre-save hook - validate dates and set defaults
trainingSchema.pre('save', function() {
  // Validate that end date is after start date
  if (this.schedule && this.schedule.startDate && this.schedule.endDate) {
    if (new Date(this.schedule.endDate) <= new Date(this.schedule.startDate)) {
      throw new Error('End date must be after start date');
    }
  }

  // Set default status if not provided
  if (!this.status) {
    this.status = 'scheduled';
  }
});

// Pre-validate hook - validate required fields
trainingSchema.pre('validate', function() {
  // Ensure required fields are present
  if (!this.name) {
    throw new Error('Training name is required');
  }
  if (!this.type) {
    throw new Error('Training type is required');
  }
  if (!this.schedule || !this.schedule.startDate) {
    throw new Error('Schedule start date is required');
  }
  if (!this.schedule || !this.schedule.endDate) {
    throw new Error('Schedule end date is required');
  }
});

// ==================== VIRTUALS ====================

// Virtual for available spots
trainingSchema.virtual('availableSpots').get(function() {
  if (!this.maxAttendees) return 0;
  const registeredCount = this.attendees.filter(a => 
    a.attendanceStatus === 'registered' || a.attendanceStatus === 'attended'
  ).length;
  return Math.max(0, this.maxAttendees - registeredCount);
});

// Virtual for completion rate
trainingSchema.virtual('completionRate').get(function() {
  if (this.attendees.length === 0) return 0;
  const completed = this.attendees.filter(a => a.completed).length;
  return Math.round((completed / this.attendees.length) * 100);
});

// Virtual for total attendees count
trainingSchema.virtual('totalAttendees').get(function() {
  return this.attendees.length;
});

// Virtual for total registered count
trainingSchema.virtual('registeredCount').get(function() {
  return this.attendees.filter(a => a.attendanceStatus === 'registered').length;
});

// Virtual for total completed count
trainingSchema.virtual('completedCount').get(function() {
  return this.attendees.filter(a => a.completed).length;
});

// Virtual for training duration in hours
trainingSchema.virtual('totalHours').get(function() {
  if (this.duration) {
    let hours = 0;
    if (this.duration.hours) hours += this.duration.hours;
    if (this.duration.days) hours += this.duration.days * 8; // 8 hours per day
    if (this.duration.weeks) hours += this.duration.weeks * 40; // 40 hours per week
    return hours;
  }
  return 0;
});

// ==================== INSTANCE METHODS ====================

// Method to check if user is registered
trainingSchema.methods.isUserRegistered = function(userId) {
  if (!userId) return false;
  return this.attendees.some(a => a.user && a.user.toString() === userId.toString());
};

// Method to register user for training
trainingSchema.methods.registerUser = function(userId) {
  if (this.isUserRegistered(userId)) {
    throw new Error('User is already registered for this training');
  }
  
  if (this.availableSpots <= 0) {
    throw new Error('No available spots for this training');
  }
  
  this.attendees.push({
    user: userId,
    attendanceStatus: 'registered'
  });
  
  return this.save();
};

// Method to mark attendance
trainingSchema.methods.markAttendance = function(userId, status, score = null, feedback = null) {
  const attendee = this.attendees.find(a => a.user && a.user.toString() === userId.toString());
  if (!attendee) {
    throw new Error('User is not registered for this training');
  }
  
  attendee.attendanceStatus = status;
  if (status === 'completed') {
    attendee.completed = true;
    attendee.completionDate = new Date();
  }
  if (score !== null) {
    attendee.score = score;
  }
  if (feedback !== null) {
    attendee.feedback = feedback;
  }
  
  return this.save();
};

// Method to get completed attendees
trainingSchema.methods.getCompletedAttendees = function() {
  return this.attendees.filter(a => a.completed);
};

// Method to get attendees by status
trainingSchema.methods.getAttendeesByStatus = function(status) {
  return this.attendees.filter(a => a.attendanceStatus === status);
};

// Method to get user's attendance status
trainingSchema.methods.getUserAttendanceStatus = function(userId) {
  const attendee = this.attendees.find(a => a.user && a.user.toString() === userId.toString());
  return attendee ? attendee.attendanceStatus : null;
};

// Method to get user's score
trainingSchema.methods.getUserScore = function(userId) {
  const attendee = this.attendees.find(a => a.user && a.user.toString() === userId.toString());
  return attendee ? attendee.score : null;
};

// Method to update user's feedback
trainingSchema.methods.updateFeedback = function(userId, rating, comments) {
  const attendee = this.attendees.find(a => a.user && a.user.toString() === userId.toString());
  if (!attendee) {
    throw new Error('User is not registered for this training');
  }
  
  attendee.feedback = {
    rating: rating,
    comments: comments || ''
  };
  
  return this.save();
};

// ==================== STATIC METHODS ====================

// Static method to get upcoming trainings
trainingSchema.statics.getUpcoming = function(days = 30) {
  const now = new Date();
  const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  
  return this.find({
    'schedule.startDate': { $gte: now, $lte: future },
    status: 'scheduled'
  }).sort({ 'schedule.startDate': 1 });
};

// Static method to get trainings by department
trainingSchema.statics.getByDepartment = function(department) {
  return this.find({
    $or: [
      { department: department },
      { department: 'all' }
    ],
    status: { $ne: 'cancelled' }
  }).sort({ 'schedule.startDate': 1 });
};

// Static method to get trainings by certification
trainingSchema.statics.getByCertification = function(certification) {
  return this.find({
    certification: certification,
    status: { $in: ['scheduled', 'in_progress'] }
  }).sort({ 'schedule.startDate': 1 });
};

// Static method to get trainings by status
trainingSchema.statics.getByStatus = function(status) {
  return this.find({ status: status }).sort({ 'schedule.startDate': 1 });
};

// Static method to get trainings by type
trainingSchema.statics.getByType = function(type) {
  return this.find({ type: type }).sort({ 'schedule.startDate': 1 });
};

// Static method to get training statistics
trainingSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAttendees: { $sum: { $size: '$attendees' } }
      }
    }
  ]);
  
  const total = await this.countDocuments();
  const byType = await this.aggregate([
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const byDepartment = await this.aggregate([
    {
      $group: {
        _id: '$department',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const byCertification = await this.aggregate([
    {
      $group: {
        _id: '$certification',
        count: { $sum: 1 }
      }
    }
  ]);
  
  return {
    total,
    byStatus: stats,
    byType,
    byDepartment,
    byCertification
  };
};

// Static method to get upcoming trainings for a user
trainingSchema.statics.getUpcomingForUser = async function(userId, days = 30) {
  const now = new Date();
  const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  
  return this.find({
    'schedule.startDate': { $gte: now, $lte: future },
    status: 'scheduled',
    'attendees.user': userId
  }).sort({ 'schedule.startDate': 1 });
};

// Static method to get completed trainings for a user
trainingSchema.statics.getCompletedForUser = async function(userId) {
  return this.find({
    status: 'completed',
    'attendees.user': userId,
    'attendees.completed': true
  }).sort({ 'schedule.startDate': -1 });
};

// ==================== INDEXES ====================

// Indexes - keep only one set
trainingSchema.index({ name: 1 });
trainingSchema.index({ type: 1, category: 1 });
trainingSchema.index({ 'schedule.startDate': 1, 'schedule.endDate': 1 });
trainingSchema.index({ status: 1 });
trainingSchema.index({ department: 1 });
trainingSchema.index({ 'attendees.user': 1 });
trainingSchema.index({ certification: 1 });

module.exports = mongoose.model('Training', trainingSchema);