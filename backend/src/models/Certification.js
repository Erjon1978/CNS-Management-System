const mongoose = require('mongoose');

const certificationSchema = new mongoose.Schema({
  value: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[a-z0-9_]+$/, 'Value may only contain lowercase letters, numbers, and underscores']
  },
  label: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Certification', certificationSchema);
