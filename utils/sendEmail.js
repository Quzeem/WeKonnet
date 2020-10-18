const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  // Transport object
  const message = {
    from: options.sender,
    to: options.receiver,
    subject: options.subject,
    text: options.body,
  };

  // send an email
  await transporter.sendMail(message);
};

module.exports = sendEmail;
