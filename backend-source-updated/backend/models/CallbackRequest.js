const mongoose = require('mongoose');

const CallbackRequestSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, maxlength: 120, default: '' },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    preferredTime: { type: String, trim: true, maxlength: 100, default: '' },
    context: { type: String, trim: true, maxlength: 500, default: '' }, // e.g. "EMI Calculator" or "Eligibility Calculator"
    status: { type: String, enum: ['new', 'called', 'closed'], default: 'new' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('CallbackRequest', CallbackRequestSchema);
