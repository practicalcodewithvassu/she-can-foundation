const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const Message = require('../models/Message');

const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);
const validatePhone = (phone) => !phone || /^[0-9+\-\s()]{7,20}$/.test(phone);
const canSendEmail = () => Boolean(process.env.EMAIL_HOST && process.env.EMAIL_PORT && process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.NOTIFY_EMAIL);

const createTransporter = () => {
  if (!canSendEmail()) return null;

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

const sendNotification = async ({ name, email, subject, phone, message }) => {
  const transporter = createTransporter();
  if (!transporter) return;

  const adminEmail = process.env.NOTIFY_EMAIL;
  const mail = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: adminEmail,
    subject: `New contact form submission: ${subject || 'General inquiry'}`,
    text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || 'N/A'}\nSubject: ${subject || 'General inquiry'}\n\nMessage:\n${message || 'No message provided.'}`,
    html: `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Phone:</strong> ${phone || 'N/A'}</p><p><strong>Subject:</strong> ${subject || 'General inquiry'}</p><p><strong>Message:</strong></p><p>${message ? message.replace(/\n/g, '<br>') : 'No message provided.'}</p>`
  };

  await transporter.sendMail(mail);
};

router.post('/', async (req, res) => {
  const { name, email, subject, phone, message } = req.body;

  if (!name?.trim() || !email?.trim()) {
    return res.status(400).json({ error: 'Name and email are required' });
  }
  if (!validateEmail(email)) {
    return res.status(400).json({ error: 'A valid email is required' });
  }
  if (!validatePhone(phone)) {
    return res.status(400).json({ error: 'Enter a valid phone number or leave it blank' });
  }

  try {
    if (process.env.MONGO_URI) {
      const doc = new Message({
        name: name.trim(),
        email: email.trim(),
        subject: subject?.trim() || 'General inquiry',
        phone: phone?.trim(),
        message: message?.trim() || ''
      });
      await doc.save();
    }

    if (canSendEmail()) {
      await sendNotification({ name: name.trim(), email: email.trim(), subject: subject?.trim(), phone: phone?.trim(), message: message?.trim() });
    }

    return res.json({ message: 'Form submitted successfully' });
  } catch (err) {
    console.error('Form submission error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
