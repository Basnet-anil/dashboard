const mongoose = require('mongoose');

const PurchaseSchema = new mongoose.Schema({
  sn: Number,
  date: String,
  vendor: String,
  particular: String,
  discount: Number,
  vatRate: String,
  taxable: Number,
  vat: Number,
  total: Number,
  paid: Number,
  credit: Number
}, { timestamps: true });

module.exports = mongoose.model('Purchase', PurchaseSchema);
