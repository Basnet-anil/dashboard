const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String },
  contactNo: { type: String },
  email: { type: String },
  vatNo: { type: String },
  objective: { type: String },
  fiscalYear: { type: String },
  contactPerson: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Company', CompanySchema);
