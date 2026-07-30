const mongoose = require('mongoose');

const subsystemSchema = new mongoose.Schema({
  value: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  label: {
    type: String,
    required: true,
    trim: true
  }
}, { _id: true });

const systemTypeSchema = new mongoose.Schema({
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
  },
  subsystems: [subsystemSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('SystemType', systemTypeSchema);
