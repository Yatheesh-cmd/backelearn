const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'instructor', 'admin'], default: 'student' },
  isVerified: { type: Boolean, default: false },
  verificationCode: { type: String, default: null },
  isBanned: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);