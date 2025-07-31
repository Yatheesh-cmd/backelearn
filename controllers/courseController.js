const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Quiz = require('../models/Quiz');
const fs = require('fs');
const path = require('path');

exports.createCourse = async (req, res) => {
  const { title, description, category } = req.body;
  const thumbnail = req.file?.filename;

  try {
    const course = new Course({
      title,
      description,
      category,
      thumbnail,
      instructor: req.user.id,
    });
    await course.save();
    res.status(201).json({ message: 'Course created', course });
  } catch (error) {
    if (thumbnail) fs.unlinkSync(path.join(__dirname, '../Uploads', thumbnail));
    res.status(500).json({ message: error.message });
  }
};

exports.getAllCourses = async (req, res) => {
  const { search, category, all } = req.query;
  try {
    const query = all ? {} : { status: 'approved' };
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { 'instructor.username': { $regex: search, $options: 'i' } },
      ];
    }
    if (category) query.category = category;
    const courses = await Course.find(query).populate('instructor', 'username');
    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getInstructorCourses = async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user.id })
      .populate('instructor', 'username')
      .populate('lessons')
      .populate({
        path: 'quizzes',
        populate: {
          path: 'lessonId',
          select: 'title'
        }
      });
    res.status(200).json({ data: courses });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCourseDetails = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'username')
      .populate('lessons')
      .populate('quizzes');
    if (!course) return res.status(404).json({ message: 'Course not found' });
    console.log('getCourseDetails: Fetched course:', JSON.stringify({
      _id: course._id,
      title: course.title,
      quizzes: course.quizzes.map(q => ({ _id: q._id, lessonId: q.lessonId, title: q.title }))
    }, null, 2)); // Debugging log
    res.status(200).json(course);
  } catch (error) {
    console.error('getCourseDetails: Error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

exports.updateCourse = async (req, res) => {
  const { title, description, category } = req.body;
  const thumbnail = req.file?.filename;

  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (course.instructor.toString() !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });

    course.title = title || course.title;
    course.description = description || course.description;
    course.category = category || course.category;
    if (thumbnail) {
      if (course.thumbnail) fs.unlinkSync(path.join(__dirname, '../Uploads', course.thumbnail));
      course.thumbnail = thumbnail;
    }
    course.status = 'pending';
    await course.save();
    res.status(200).json({ message: 'Course updated', course });
  } catch (error) {
    if (thumbnail) fs.unlinkSync(path.join(__dirname, '../Uploads', thumbnail));
    res.status(500).json({ message: error.message });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (course.instructor.toString() !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });

    if (course.thumbnail) fs.unlinkSync(path.join(__dirname, '../Uploads', course.thumbnail));
    await Lesson.deleteMany({ courseId: course._id });
    await Quiz.deleteMany({ courseId: course._id });
    await Course.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Course deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};