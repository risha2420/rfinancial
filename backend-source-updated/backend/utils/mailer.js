const nodemailer = require('nodemailer');

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  MAIL_FROM,
  NOTIFY_EMAIL
} = process.env;

let transporter = null;
let configWarningShown = false;

function isMailConfigured() {
  return Boolean(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS && NOTIFY_EMAIL);
}

function getTransporter() {
  if (transporter) return transporter;

  if (!isMailConfigured()) {
    if (!configWarningShown) {
      console.warn(
        '[mailer] SMTP is not fully configured (SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS/NOTIFY_EMAIL). ' +
        'Notification emails will be skipped and only logged. See .env.example.'
      );
      configWarningShown = true;
    }
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: String(SMTP_SECURE).toLowerCase() === 'true', // true for 465, false for other ports (STARTTLS)
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });

  return transporter;
}

/**
 * Send a plain-text notification email to the configured NOTIFY_EMAIL address.
 * Never throws — logs and returns { ok, error } so a mail failure never breaks
 * the API response to the end user (the record is already saved in MongoDB).
 *
 * @param {string} subject
 * @param {string} text  Plain text body
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
async function sendNotification(subject, text) {
  const t = getTransporter();
  if (!t) {
    return { ok: false, error: 'SMTP not configured' };
  }

  try {
    await t.sendMail({
      from: MAIL_FROM || SMTP_USER,
      to: NOTIFY_EMAIL,
      subject,
      text
    });
    console.log(`[mailer] Notification email sent: "${subject}" -> ${NOTIFY_EMAIL}`);
    return { ok: true };
  } catch (err) {
    console.error('[mailer] Failed to send notification email:', err.message);
    return { ok: false, error: err.message };
  }
}

module.exports = { sendNotification, isMailConfigured };
