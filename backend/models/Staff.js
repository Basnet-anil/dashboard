const mongoose = require('mongoose');

const StaffSchema = new mongoose.Schema({
  sn: Number,
  name: { type: String, required: true, unique: true },
  designation: String
}, { timestamps: true });

module.exports = mongoose.model('Staff', StaffSchema);
