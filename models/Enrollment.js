const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  progress: [{
    lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
    watched: { type: Boolean, default: false },
    quizScore: { type: Number },
  }],
}, { timestamps: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);