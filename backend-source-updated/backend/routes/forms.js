const express = require('express');
const router = express.Router();

const ContactMessage = require('../models/ContactMessage');
const LoanEnquiry = require('../models/LoanEnquiry');
const CallbackRequest = require('../models/CallbackRequest');
const { sendNotification } = require('../utils/mailer');

// Builds a plain-text notification body, consistent across all three form types.
function buildNotificationEmail({ formType, name, contact, details, timestamp }) {
  const lines = [
    `New ${formType} from R Financial Services website`,
    '',
    `Name: ${name || '(not provided)'}`,
    `Contact: ${contact || '(not provided)'}`,
    '',
    'Details:',
    details || '(no additional details provided)',
    '',
    `Submitted: ${timestamp}`
  ];
  return lines.join('\n');
}

// Basic shared validators (no external dependency, kept minimal on purpose)
function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}
function isValidEmail(v) {
  return typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
function isValidPhone(v) {
  return typeof v === 'string' && /^[+]?[\d\s-]{7,15}$/.test(v);
}

/**
 * POST /api/contact
 * Body: { name, phone, email, subject, message }
 */
router.post('/contact', async (req, res) => {
  try {
    const { name, phone, email, subject, message } = req.body || {};
    if (!isNonEmptyString(name) || !isValidPhone(phone) || !isValidEmail(email)) {
      return res.status(400).json({ ok: false, error: 'Please provide a valid name, phone and email.' });
    }
    const doc = await ContactMessage.create({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      subject: (subject || '').trim(),
      message: (message || '').trim()
    });
    console.log(`[contact] New message from ${doc.name} <${doc.email}> — id ${doc._id}`);

    // Forward a copy to sapan@rfinancial.in. Failure here is logged but never blocks
    // the response — the submission is already safely saved in MongoDB above.
    const emailBody = buildNotificationEmail({
      formType: 'Contact Message',
      name: doc.name,
      contact: `${doc.phone} / ${doc.email}`,
      details: `Subject: ${doc.subject || '(none)'}\n\n${doc.message || '(no message)'}`,
      timestamp: doc.createdAt.toISOString()
    });
    sendNotification('New Inquiry/Application from Website', emailBody)
      .then(r => { if (!r.ok) console.error('[contact] Email failed:', r.error); })
      .catch(e => console.error('[contact] Email error:', e));

    res.status(201).json({ ok: true, id: doc._id });
  } catch (err) {
    console.error('POST /api/contact error:', err);
    res.status(500).json({ ok: false, error: 'Something went wrong. Please try again.' });
  }
});

/**
 * POST /api/loan-enquiry
 * Body: { name, phone, email, loanType, message }
 */
router.post('/loan-enquiry', async (req, res) => {
  try {
    const { name, phone, email, loanType, message } = req.body || {};
    if (!isNonEmptyString(name) || !isValidPhone(phone) || !isValidEmail(email) || !isNonEmptyString(loanType)) {
      return res.status(400).json({ ok: false, error: 'Please provide a valid name, phone, email and loan type.' });
    }
    const doc = await LoanEnquiry.create({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      loanType: loanType.trim(),
      message: (message || '').trim()
    });
    console.log(`[loan-enquiry] New enquiry (${doc.loanType}) from ${doc.name} — id ${doc._id}`);

    const emailBody = buildNotificationEmail({
      formType: 'Loan Enquiry',
      name: doc.name,
      contact: `${doc.phone} / ${doc.email}`,
      details: `Loan Type: ${doc.loanType}\n\n${doc.message || '(no message)'}`,
      timestamp: doc.createdAt.toISOString()
    });
    sendNotification('New Inquiry/Application from Website', emailBody)
      .then(r => { if (!r.ok) console.error('[loan-enquiry] Email failed:', r.error); })
      .catch(e => console.error('[loan-enquiry] Email error:', e));

    res.status(201).json({ ok: true, id: doc._id });
  } catch (err) {
    console.error('POST /api/loan-enquiry error:', err);
    res.status(500).json({ ok: false, error: 'Something went wrong. Please try again.' });
  }
});

/**
 * POST /api/callback-request
 * Body: { name, phone, preferredTime, context }
 */
router.post('/callback-request', async (req, res) => {
  try {
    const { name, phone, preferredTime, context } = req.body || {};
    if (!isValidPhone(phone)) {
      return res.status(400).json({ ok: false, error: 'Please provide a valid phone number.' });
    }
    const doc = await CallbackRequest.create({
      name: (name || '').trim(),
      phone: phone.trim(),
      preferredTime: (preferredTime || '').trim(),
      context: (context || '').trim()
    });
    console.log(`[callback-request] New callback request from ${doc.phone} — id ${doc._id}`);

    const emailBody = buildNotificationEmail({
      formType: 'Callback Request',
      name: doc.name,
      contact: doc.phone,
      details: `Preferred time: ${doc.preferredTime || '(any time)'}\nContext: ${doc.context || '(none)'}`,
      timestamp: doc.createdAt.toISOString()
    });
    sendNotification('New Inquiry/Application from Website', emailBody)
      .then(r => { if (!r.ok) console.error('[callback] Email failed:', r.error); })
      .catch(e => console.error('[callback] Email error:', e));

    res.status(201).json({ ok: true, id: doc._id });
  } catch (err) {
    console.error('POST /api/callback-request error:', err);
    res.status(500).json({ ok: false, error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
