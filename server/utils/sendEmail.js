const nodemailer = require("nodemailer");

const {
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_USER,
  EMAIL_PASS,
} = process.env;

const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: Number(EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

async function sendEmail({ to, subject, html }) {
  try {
    if (!EMAIL_USER) {
      console.error("EMAIL_USER is not configured. Skipping email send.");
      return;
    }

    await transporter.sendMail({
      from: `"CollegeBazaar" <${EMAIL_USER}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error("Error sending email:", err);
    throw err;
  }
}

module.exports = {
  sendEmail,
};

