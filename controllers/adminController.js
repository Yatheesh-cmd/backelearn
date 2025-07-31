const Course = require('../models/Course');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const Notification = require('../models/Notification');

exports.approveCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    course.status = 'approved';
    await course.save();

    const notification = new Notification({
      userId: course.instructor,
      type: 'course_update',
      message: `Your course "${course.title}" has been approved`,
    });
    await notification.save();

    res.status(200).json({ message: 'Course approved' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.rejectCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    course.status = 'rejected';
    await course.save();

    const notification = new Notification({
      userId: course.instructor,
      type: 'course_update',
      message: `Your course "${course.title}" has been rejected`,
    });
    await notification.save();

    res.status(200).json({ message: 'Course rejected' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const courses = await Course.find().populate('instructor').populate('lessons');
    const enrollments = await Enrollment.find();

    const popularCourses = courses
      .map(course => ({
        title: course.title,
        enrollmentCount: enrollments.filter(e => e.courseId.toString() === course._id.toString()).length,
      }))
      .sort((a, b) => b.enrollmentCount - a.enrollmentCount)
      .slice(0, 3)
      .map(c => c.title);

    const completionRate = enrollments.length
      ? (enrollments.reduce((acc, e) => {
          const course = courses.find(c => c._id.toString() === e.courseId.toString());
          const lessonCount = course && course.lessons ? course.lessons.length : 0;
          if (lessonCount === 0) return acc;
          const completed = e.progress.filter(p => p.watched).length;
          return acc + (completed / lessonCount);
        }, 0) / enrollments.length) * 100
      : 0;

    const users = await User.find().select('username role isBanned');

    res.status(200).json({
      totalUsers,
      popularCourses,
      completionRate: completionRate.toFixed(2),
      users,
      courses,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.manageUser = async (req, res) => {
  const { id, action } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isBanned = action === 'ban';
    await user.save();
    res.status(200).json({ message: `User ${action}ed` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};