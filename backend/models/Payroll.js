const mongoose = require('mongoose');

const PayrollSchema = new mongoose.Schema({
  sn: Number,
  name: String,
  date: String,
  basic: Number,
  tax: Number,
  deducted: Number,
  trans: Number,
  comms: Number,
  bonus: Number,
  received: Number
}, { timestamps: true });

module.exports = mongoose.model('Payroll', PayrollSchema);
