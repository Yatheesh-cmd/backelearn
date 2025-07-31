const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['course_update', 'assignment_graded', 'recommendation'], required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);