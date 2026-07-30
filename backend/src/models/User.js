const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  employeeId: {
    type: String,
    unique: true,
    sparse: true
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'engineer', 'technician'],
    default: 'engineer'
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  },
  certifications: [{
    type: String
  }],
  certificationsExpiry: [{
    certification: String,
    expiryDate: Date,
    issuedDate: Date,
    issuedBy: String,
    certificateNumber: String
  }],
  contactInfo: {
    phone: String,
    mobile: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String
    }
  },
  trainings: [{
    name: String,
    provider: String,
    date: Date,
    expiryDate: Date,
    certificate: String,
    type: {
      type: String,
      enum: ['initial', 'recurrent', 'refresher', 'specialized']
    }
  }],
  vacationDays: [{
    startDate: Date,
    endDate: Date,
    type: {
      type: String,
      enum: ['annual', 'sick', 'personal', 'training', 'other']
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending'
    },
    notes: String,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  extraHours: [{
    date: Date,
    hours: Number,
    description: String,
    type: {
      type: String,
      enum: ['overtime', 'on_call', 'emergency', 'standby']
    },
    approved: {
      type: Boolean,
      default: false
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  skills: [{
    name: String,
    proficiency: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert']
    },
    yearsOfExperience: Number
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function() {
  // Only hash the password if it's modified (or new)
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match password - async method
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Check if user has certification
userSchema.methods.hasCertification = function(certification) {
  return this.certifications && this.certifications.includes(certification);
};

// Get upcoming vacation
userSchema.methods.getUpcomingVacation = function() {
  const now = new Date();
  return this.vacationDays
    .filter(v => v.status === 'approved' && v.startDate > now)
    .sort((a, b) => a.startDate - b.startDate);
};

// Get user's full name
userSchema.methods.getFullName = function() {
  return `${this.firstName} ${this.lastName}`;
};

// Get user's role display
userSchema.methods.getRoleDisplay = function() {
  const roles = {
    admin: 'Administrator',
    manager: 'Manager',
    engineer: 'Engineer',
    technician: 'Technician'
  };
  return roles[this.role] || this.role;
};

// Check if user has expired certifications
userSchema.methods.hasExpiredCertifications = function() {
  const now = new Date();
  return this.certificationsExpiry.some(cert => 
    cert.expiryDate && new Date(cert.expiryDate) < now
  );
};

// Get expiring certifications (within 30 days)
userSchema.methods.getExpiringCertifications = function(daysThreshold = 30) {
  const now = new Date();
  const threshold = new Date(now.getTime() + daysThreshold * 24 * 60 * 60 * 1000);
  
  return this.certificationsExpiry.filter(cert => 
    cert.expiryDate && 
    new Date(cert.expiryDate) > now && 
    new Date(cert.expiryDate) <= threshold
  );
};

// Indexes (username/email already indexed via `unique: true` above)
userSchema.index({ group: 1 });
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);