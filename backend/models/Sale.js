const mongoose = require('mongoose');

const SaleSchema = new mongoose.Schema({
  sn: Number,
  date: String,
  customer: String,
  service: String,
  discount: Number,
  vatRate: String,
  taxable: Number,
  vat: Number,
  total: Number,
  received: Number,
  receivedDate: String,
  balance: Number
}, { timestamps: true });

module.exports = mongoose.model('Sale', SaleSchema);
