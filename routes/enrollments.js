const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { enrollCourse, getEnrolledCourses, updateProgress } = require('../controllers/enrollmentController');

router.post('/:courseId', authMiddleware, enrollCourse);
router.get('/', authMiddleware, getEnrolledCourses);
router.get('/:courseId', authMiddleware, getEnrolledCourses);
router.put('/progress/:courseId/:lessonId', authMiddleware, updateProgress);

module.exports = router;