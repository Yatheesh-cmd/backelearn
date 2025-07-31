const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Quiz = require('../models/Quiz');
const fs = require('fs');
const path = require('path');
const cloudinary = require('../cloudinaryConfig');

exports.createCourse = async (req, res) => {
  const { title, description, category } = req.body;
  let thumbnailUrl = null;
  let publicId = null;

  try {
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.buffer.toString('base64'), {
        folder: 'courses',
        resource_type: 'image',
      });
      thumbnailUrl = result.secure_url;
      publicId = result.public_id;
    }

    const course = new Course({
      title,
      description,
      category,
      thumbnail: thumbnailUrl,
      instructor: req.user.id,
    });
    await course.save();
    res.status(201).json({ message: 'Course created', course });
  } catch (error) {
    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
    }
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
    }, null, 2)); 
    res.status(200).json(course);
  } catch (error) {
    console.error('getCourseDetails: Error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

exports.updateCourse = async (req, res) => {
  const { title, description, category } = req.body;
  let thumbnailUrl = null;
  let newPublicId = null;

  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (course.instructor.toString() !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.buffer.toString('base64'), {
        folder: 'courses',
        resource_type: 'image',
      });
      thumbnailUrl = result.secure_url;
      newPublicId = result.public_id;

      if (course.thumbnail) {
        const oldPublicId = course.thumbnail.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`courses/${oldPublicId}`);
      }
    }

    course.title = title || course.title;
    course.description = description || course.description;
    course.category = category || course.category;
    course.thumbnail = thumbnailUrl || course.thumbnail;
    course.status = 'pending';
    await course.save();
    res.status(200).json({ message: 'Course updated', course });
  } catch (error) {
    if (newPublicId) {
      await cloudinary.uploader.destroy(newPublicId);
    }
    res.status(500).json({ message: error.message });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (course.instructor.toString() !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });


    if (course.thumbnail) {
      const publicId = course.thumbnail.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`courses/${publicId}`);
    }

    await Lesson.deleteMany({ courseId: course._id });
    await Quiz.deleteMany({ courseId: course._id });
    await Course.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Course deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};