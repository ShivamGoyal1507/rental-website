const mongoose = require('mongoose');

const readingSchema = new mongoose.Schema({
  userId: {
    type: Number,
    required: true
  },                                                          
  previousReading: {
    type: Number,
     
  },
  previousReadingDate: {
    type: Date,
     
  },
  oldpreviousReading: {
    type: Number,
  },
  oldpreviousReadingDate: {
    type: Date,
  },
  month: {
    type: String, 
    default: null
  },
  currentReading: {
    type: Number,
    default: null // Use -1 if you want a numeric placeholder
  },
  currentReadingDate: {
    type: Date,
    default: null
  },
  rent: {
    type: Number,
    required: true
  },
  totalrent: {
    type: Number,
    default: null
  },
  status: {
    type: String,
    enum: ['Paid', 'Pending', 'Failed', 'New'],
    default: 'New'
  },
  notes: {
    type: String,
    default: '-' 
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('meter_reading', readingSchema);