const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.register = async (req, res) => {
  const { username, email, password, role } = req.body;
  try {
    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = role === 'student' ? Math.floor(100000 + Math.random() * 900000).toString() : null;
    user = new User({
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      verificationCode,
      isVerified: role !== 'student',
    });
    await user.save();

    if (role === 'student') {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Verify Your Email - SkillHub',
        html: `<p>Your verification code is <strong>${verificationCode}</strong>. Enter this code to verify your email.</p>`,
      };
      await transporter.sendMail(mailOptions);
      res.status(201).json({ message: 'User registered. Please verify your email.', email: email.toLowerCase() });
    } else {
      res.status(201).json({ message: 'User registered' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  const { email, password, role } = req.body;
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || user.role !== role) return res.status(400).json({ message: 'Invalid credentials' });
    if (!user.isVerified) return res.status(400).json({ message: 'Email not verified' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ token, user: { id: user._id, username: user.username, role: user.role } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.verifyEmail = async (req, res) => {
  const { email, code } = req.body;
  console.log('Verify email request:', { email, code }); // Debugging log
  try {
    if (!email || !code) {
      return res.status(400).json({ message: 'Email and verification code are required' });
    }
    const user = await User.findOne({ email: email.toLowerCase(), verificationCode: code });
    if (!user) {
      console.log('No user found for email:', email.toLowerCase(), 'and code:', code);
      return res.status(400).json({ message: 'Invalid email or verification code' });
    }

    user.isVerified = true;
    user.verificationCode = null;
    await user.save();
    res.status(200).json({ message: 'Email verified' });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.resendCode = async (req, res) => {
  const { email } = req.body;
  console.log('Resend code request for email:', email); // Debugging log
  try {
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log('No user found for email:', email.toLowerCase());
      return res.status(400).json({ message: 'User not found' });
    }
    if (user.isVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }
    if (user.role !== 'student') {
      return res.status(400).json({ message: 'Only students need email verification' });
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationCode = verificationCode;
    await user.save();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify Your Email - SkillHub',
      html: `<p>Your new verification code is <strong>${verificationCode}</strong>. Enter this code to verify your email.</p>`,
    };
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'New verification code sent', email: email.toLowerCase() });
  } catch (error) {
    console.error('Resend code error:', error);
    res.status(500).json({ message: error.message });
  }
};