const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'login_user',
    required: true
  },
  billMonth: {
    type: String, 
    required: true
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  amountPaid: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'UPI', 'Card', 'Bank Transfer'],
    default: 'Cash'
  },
  status: {
    type: String,
    enum: ['Paid', 'Pending', 'Failed','New'],
    default: 'New'
  },
  meterStartReading: {
    type: Number,
    required: true
  },
  meterEndReading: {
    type: Number,
    required: true
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('bill_payment', billSchema);