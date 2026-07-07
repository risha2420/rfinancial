const mongoose = require('mongoose');

const LoanEnquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 150 },
    loanType: { type: String, required: true, trim: true, maxlength: 100 },
    message: { type: String, trim: true, maxlength: 3000, default: '' },
    status: { type: String, enum: ['new', 'in-progress', 'converted', 'closed'], default: 'new' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('LoanEnquiry', LoanEnquirySchema);
