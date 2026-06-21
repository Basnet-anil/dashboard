const mongoose = require('mongoose');

const BankTransactionSchema = new mongoose.Schema({
  type: { type: String, enum: ['Deposit', 'Withdraw'] },
  sn: Number,
  cheque: String,
  acNo: String,
  amount: Number,
  date: String,
  bank: String,
  amountToBePaid: Number,
  paid: Number,
  purposes: String,
  balance: Number,
  credit: Number,
  paymentHistory: [{
    date: String,
    amount: Number,
    remarks: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('BankTransaction', BankTransactionSchema);
