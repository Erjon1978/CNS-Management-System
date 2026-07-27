const mongoose = require('mongoose');

const sparePartSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  partNumber: {
    type: String,
    unique: true,
    required: true
  },
  description: String,
  manufacturer: String,
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  minimumQuantity: {
    type: Number,
    default: 5
  },
  location: String,
  compatibleSystems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'System'
  }],
  price: Number,
  supplier: String,
  leadTime: Number,
  datasheet: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Remove duplicate indexes - keep only one set
sparePartSchema.index({ name: 1 });
sparePartSchema.index({ compatibleSystems: 1 });
// Remove duplicate partNumber index since it's already defined with unique: true

module.exports = mongoose.model('SparePart', sparePartSchema);