# R Financial Services — Backend API

Minimal Express + MongoDB backend that captures the three form submissions used on the site:

- `POST /api/contact` — Contact Us page form
- `POST /api/loan-enquiry` — Service card "Enquire Now" / "Start Investing" modal
- `POST /api/callback-request` — "Request a Callback" buttons on the Loan Calculators page
- `GET /api/health` — health check

No admin dashboard, auth, or payment integration is included — this build intentionally captures data only, per the project scope.

## 1. Local setup

```bash
cd backend
npm install
cp .env.example .env
# then edit .env with your real MongoDB URI
npm run dev      # nodemon, auto-restarts on change
# or
npm start
```

The API will run on `http://localhost:5000` by default.

## 2. MongoDB

Easiest path: create a free cluster at https://www.mongodb.com/atlas, add a database user, allow your IP (or `0.0.0.0/0` while testing), and copy the connection string into `MONGODB_URI` in `.env`. Collections (`contactmessages`, `loanenquiries`, `callbackrequests`) are created automatically on first write — no manual schema setup needed.

## 3. Connecting the frontend

The provided frontend artifact currently **simulates** form submissions in-browser (so you can see the full UX without a live backend). To wire it to this real API, replace the `simulateSubmit()` calls in the frontend's JavaScript with real `fetch()` calls, e.g.:

```js
async function submitContact(data) {
  const res = await fetch('https://your-api-domain.com/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}
```

Do the same for the loan enquiry modal (`/api/loan-enquiry`) and the calculator "Request a Callback" buttons (`/api/callback-request`).

## 4. Deployment

Any Node host works (Render, Railway, Fly.io, a VPS, etc.):

1. Push this `backend/` folder to a Git repo (or deploy directly).
2. Set environment variables (`MONGODB_URI`, `PORT`, `ALLOWED_ORIGINS`) in your host's dashboard.
3. Build/start command: `npm install && npm start`.
4. Set `ALLOWED_ORIGINS` to your deployed frontend's URL so CORS allows it.

## 5. Notifications

Every successful submission on all three endpoints is:

1. Saved to MongoDB (as before), and
2. Emailed as plain text to `NOTIFY_EMAIL` (`sapan@rfinancial.in` by default) via `utils/mailer.js`, using SMTP through [Nodemailer](https://nodemailer.com/).

To enable sending, fill in the SMTP block in `.env` (copy from `.env.example`):

```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=<your provider API key or SMTP password>
MAIL_FROM="R Financial Services <no-reply@rfinancial.in>"
NOTIFY_EMAIL=sapan@rfinancial.in
```

This works with any SMTP-capable provider — SendGrid, Amazon SES, Postmark, Mailgun, Zoho Mail, or a Gmail App Password.

If SMTP isn't configured, the server logs a warning and skips sending (the submission is still saved to MongoDB, so nothing is lost) — this is intentional so a mail outage never breaks the public-facing form for users. Sending failures are also caught and logged rather than thrown, for the same reason.
