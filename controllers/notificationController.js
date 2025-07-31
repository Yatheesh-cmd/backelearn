const Notification = require('../models/Notification');
const Lesson = require('../models/Lesson');

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .populate('lessonId', 'title')
      .sort({ createdAt: -1 });
    const notificationsWithLessonTitle = notifications.map(notification => ({
      ...notification._doc,
      lessonTitle: notification.lessonId ? notification.lessonId.title : null
    }));
    res.status(200).json(notificationsWithLessonTitle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    if (notification.userId.toString() !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });

    notification.read = true;
    await notification.save();
    res.status(200).json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};