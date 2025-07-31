const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const mongoose = require('mongoose');

exports.enrollCourse = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.courseId)) {
      return res.status(400).json({ message: 'Invalid course ID' });
    }
    const course = await Course.findById(req.params.courseId);
    if (!course || course.status !== 'approved') {
      return res.status(404).json({ message: 'Course not found or not approved' });
    }

    let enrollment = await Enrollment.findOne({
      studentId: req.user.id,
      courseId: req.params.courseId,
    });
    if (enrollment) return res.status(400).json({ message: 'Already enrolled' });

    enrollment = new Enrollment({
      studentId: req.user.id,
      courseId: req.params.courseId,
      progress: [],
    });
    await enrollment.save();
    res.status(201).json({ message: 'Enrolled successfully' });
  } catch (error) {
    console.error('Error in enrollCourse:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

exports.getEnrolledCourses = async (req, res) => {
  try {
    const query = {};
    if (req.params.courseId) {
      if (!mongoose.Types.ObjectId.isValid(req.params.courseId)) {
        return res.status(400).json({ message: 'Invalid course ID' });
      }
      query.courseId = req.params.courseId;
      const course = await Course.findById(req.params.courseId);
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
      if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized to view enrollments for this course' });
      }
    } else {
      query.studentId = req.user.id;
    }

    const enrollments = await Enrollment.find(query)
      .populate({
        path: 'courseId',
        populate: { path: 'instructor', select: 'username' },
      })
      .populate('studentId', 'username');

    console.log(`Enrollments found for courseId=${req.params.courseId || 'none'}:`, enrollments);

    if (req.params.courseId) {
      const enrollmentData = enrollments.map(enrollment => {
        if (!enrollment.courseId || !enrollment.studentId) {
          console.warn('Enrollment with missing courseId or studentId:', enrollment);
          return {
            _id: enrollment._id,
            studentId: {
              _id: enrollment.studentId?._id || '',
              username: enrollment.studentId?.username || 'Unknown',
            },
            courseId: enrollment.courseId?._id || null,
            progress: enrollment.progress || [],
          };
        }
        return {
          _id: enrollment._id,
          studentId: {
            _id: enrollment.studentId._id,
            username: enrollment.studentId.username || 'Unknown',
          },
          courseId: enrollment.courseId._id,
          progress: enrollment.progress || [],
        };
      });
      res.status(200).json(enrollmentData);
    } else {
      const courses = enrollments
        .filter(e => e.courseId)
        .map(e => {
          const lessonCount = e.courseId?.lessons?.length || 1;
          const progress = e.progress.reduce((acc, p) => {
            return acc + (p.watched ? 100 / lessonCount : 0);
          }, 0);
          return {
            ...e.courseId._doc,
            progress: Number(progress.toFixed(2)), // Ensure progress is a number
          };
        });
      res.status(200).json(courses);
    }
  } catch (error) {
    console.error('Error in getEnrolledCourses:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

exports.updateProgress = async (req, res) => {
  const { courseId, lessonId } = req.params;
  const { watched, quizScore } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(lessonId)) {
      return res.status(400).json({ message: 'Invalid course or lesson ID' });
    }

    let enrollment = await Enrollment.findOne({
      studentId: req.user.id,
      courseId,
    });
    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    const progressIndex = enrollment.progress.findIndex(
      (p) => p.lessonId && p.lessonId.toString() === lessonId
    );

    if (progressIndex === -1) {
      enrollment.progress.push({ lessonId, watched, quizScore });
    } else {
      enrollment.progress[progressIndex] = {
        ...enrollment.progress[progressIndex],
        watched: watched ?? enrollment.progress[progressIndex].watched,
        quizScore: quizScore ?? enrollment.progress[progressIndex].quizScore,
      };
    }

    await enrollment.save();
    res.status(200).json({ message: 'Progress updated' });
  } catch (error) {
    console.error('Error in updateProgress:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};