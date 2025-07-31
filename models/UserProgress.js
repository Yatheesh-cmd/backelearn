const mongoose = require('mongoose');

const userProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
  watched: { type: Boolean, default: false },
  watchedTime: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('UserProgress', userProgressSchema);