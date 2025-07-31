const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { getNotifications, markNotificationRead } = require('../controllers/notificationController');

router.get('/', authMiddleware, getNotifications);
router.put('/:id', authMiddleware, markNotificationRead);

module.exports = router;