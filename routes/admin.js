const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { approveCourse, rejectCourse, getStats, manageUser } = require('../controllers/adminController');

router.put('/courses/approve/:id', authMiddleware, adminMiddleware, approveCourse);
router.put('/courses/reject/:id', authMiddleware, adminMiddleware, rejectCourse);
router.get('/stats', authMiddleware, adminMiddleware, getStats);
router.put('/users/:id/:action', authMiddleware, adminMiddleware, manageUser);

module.exports = router;