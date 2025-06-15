const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  room: {
    type: Number,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Complaint', complaintSchema);