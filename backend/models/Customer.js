const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  address: String,
  phone: String,
  pan: String,
  contact1: String,
  contact2: String,
  accountDetails: [{
    sn: Number,
    invoiceNo: String,
    date: String,
    programs: String,
    debit: Number,
    bank: String,
    acNo: String,
    recDate: String,
    discount: Number,
    balance: Number
  }]
}, { timestamps: true });

module.exports = mongoose.model('Customer', CustomerSchema);
