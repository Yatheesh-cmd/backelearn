const Lesson = require('../models/Lesson');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const UserProgress = require('../models/UserProgress');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

exports.getInstructorCoursess = async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user.id }).populate({
      path: 'lessons',
      select: 'title content videoUrl order',
    });
    if (!courses || courses.length === 0) {
      return res.status(404).json({ message: 'No courses found', data: [] });
    }
    res.status(200).json({ data: courses });
  } catch (error) {
    console.error('Error fetching instructor courses:', error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
};

exports.createLesson = async (req, res) => {
  const { courseId } = req.params;
  const { title, content, videoUrl, order } = req.body;
  const resources = req.files ? req.files.map(file => file.filename) : [];

  try {
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: 'Invalid course ID' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      resources.forEach(resource => {
        try {
          fs.unlinkSync(path.join(__dirname, '../Uploads', resource));
        } catch (err) {
          console.error(`Failed to delete file ${resource}:`, err.message);
        }
      });
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.instructor.toString() !== req.user.id) {
      resources.forEach(resource => {
        try {
          fs.unlinkSync(path.join(__dirname, '../Uploads', resource));
        } catch (err) {
          console.error(`Failed to delete file ${resource}:`, err.message);
        }
      });
      return res.status(403).json({ message: 'Unauthorized to add lessons to this course' });
    }

    if (!title || !content || !order) {
      resources.forEach(resource => {
        try {
          fs.unlinkSync(path.join(__dirname, '../Uploads', resource));
        } catch (err) {
          console.error(`Failed to delete file ${resource}:`, err.message);
        }
      });
      return res.status(400).json({ message: 'Title, content, and order are required' });
    }

    const lesson = new Lesson({
      courseId,
      title,
      content,
      videoUrl,
      order: parseInt(order),
      resources,
    });
    await lesson.save();

    course.lessons.push(lesson._id);
    await course.save();

    res.status(201).json({ message: 'Lesson created', lesson });
  } catch (error) {
    resources.forEach(resource => {
      try {
        fs.unlinkSync(path.join(__dirname, '../Uploads', resource));
      } catch (err) {
        console.error(`Failed to delete file ${resource}:`, err.message);
      }
    });
    console.error('Lesson creation error:', error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
};

exports.getLesson = async (req, res) => {
  const { lessonId } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(lessonId)) {
      return res.status(400).json({ message: 'Invalid lesson ID' });
    }

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    res.status(200).json(lesson);
  } catch (error) {
    console.error('Lesson retrieval error:', error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
};

exports.updateLesson = async (req, res) => {
  const { lessonId } = req.params;
  const { title, content, videoUrl, order } = req.body;
  const newResources = req.files ? req.files.map(file => file.filename) : [];

  try {
    if (!mongoose.Types.ObjectId.isValid(lessonId)) {
      return res.status(400).json({ message: 'Invalid lesson ID' });
    }

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      newResources.forEach(resource => {
        try {
          fs.unlinkSync(path.join(__dirname, '../Uploads', resource));
        } catch (err) {
          console.error(`Failed to delete file ${resource}:`, err.message);
        }
      });
      return res.status(404).json({ message: 'Lesson not found' });
    }

    const course = await Course.findById(lesson.courseId);
    if (!course) {
      newResources.forEach(resource => {
        try {
          fs.unlinkSync(path.join(__dirname, '../Uploads', resource));
        } catch (err) {
          console.error(`Failed to delete file ${resource}:`, err.message);
        }
      });
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.instructor.toString() !== req.user.id) {
      newResources.forEach(resource => {
        try {
          fs.unlinkSync(path.join(__dirname, '../Uploads', resource));
        } catch (err) {
          console.error(`Failed to delete file ${resource}:`, err.message);
        }
      });
      return res.status(403).json({ message: 'Unauthorized to update this lesson' });
    }

    if (!title || !content || !order) {
      newResources.forEach(resource => {
        try {
          fs.unlinkSync(path.join(__dirname, '../Uploads', resource));
        } catch (err) {
          console.error(`Failed to delete file ${resource}:`, err.message);
        }
      });
      return res.status(400).json({ message: 'Title, content, and order are required' });
    }

    const oldResources = lesson.resources || [];
    lesson.title = title;
    lesson.content = content;
    lesson.videoUrl = videoUrl;
    lesson.order = parseInt(order);
    lesson.resources = [...oldResources, ...newResources];
    await lesson.save();

    res.status(200).json({ message: 'Lesson updated', lesson });
  } catch (error) {
    newResources.forEach(resource => {
      try {
        fs.unlinkSync(path.join(__dirname, '../Uploads', resource));
      } catch (err) {
        console.error(`Failed to delete file ${resource}:`, err.message);
      }
    });
    console.error('Lesson update error:', error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
};

exports.deleteLesson = async (req, res) => {
  const { lessonId } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(lessonId)) {
      return res.status(400).json({ message: 'Invalid lesson ID' });
    }

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    const course = await Course.findById(lesson.courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.instructor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to delete this lesson' });
    }

    course.lessons = course.lessons.filter(l => l.toString() !== lessonId);
    await course.save();

    lesson.resources.forEach(resource => {
      try {
        fs.unlinkSync(path.join(__dirname, '../Uploads', resource));
      } catch (err) {
        console.error(`Failed to delete file ${resource}:`, err.message);
      }
    });

    await Lesson.deleteOne({ _id: lessonId });
    await UserProgress.deleteMany({ lessonId });
    await Enrollment.updateMany(
      { courseId: lesson.courseId },
      { $pull: { progress: { lessonId } } }
    );

    res.status(200).json({ message: 'Lesson deleted' });
  } catch (error) {
    console.error('Lesson deletion error:', error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
};

exports.getProgress = async (req, res) => {
  const { courseId, lessonId } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(lessonId)) {
      return res.status(400).json({ message: 'Invalid course or lesson ID' });
    }

    const progress = await UserProgress.findOne({
      userId: req.user.id,
      courseId,
      lessonId,
    });

    if (!progress) {
      return res.status(200).json({ watched: false, watchedTime: null });
    }

    res.status(200).json({
      watched: progress.watched,
      watchedTime: progress.watchedTime,
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
};

exports.updateProgress = async (req, res) => {
  const { courseId, lessonId } = req.params;
  const { watched } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(lessonId)) {
      return res.status(400).json({ message: 'Invalid course or lesson ID' });
    }

    const lesson = await Lesson.findById(lessonId);
    if (!lesson || lesson.courseId.toString() !== courseId) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    const enrollment = await Enrollment.findOne({
      studentId: req.user.id,
      courseId,
    });

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    let progress = await UserProgress.findOne({
      userId: req.user.id,
      courseId,
      lessonId,
    });

    const updateData = {
      userId: req.user.id,
      courseId,
      lessonId,
      watched: watched ?? false,
      watchedTime: watched ? new Date() : undefined,
    };

    if (!progress) {
      progress = new UserProgress(updateData);
    } else {
      progress.watched = watched ?? progress.watched;
      progress.watchedTime = watched ? new Date() : progress.watchedTime;
    }

    await progress.save();

    // Optionally, update Enrollment.progress for backward compatibility
    const progressIndex = enrollment.progress.findIndex(
      p => p.lessonId && p.lessonId.toString() === lessonId
    );

    const enrollmentUpdateData = {
      lessonId,
      watched: watched ?? false,
      watchedTime: watched ? new Date() : undefined,
      quizScore: undefined,
    };

    if (progressIndex === -1) {
      enrollment.progress.push(enrollmentUpdateData);
    } else {
      enrollment.progress[progressIndex] = {
        ...enrollment.progress[progressIndex],
        ...enrollmentUpdateData,
      };
    }

    await enrollment.save();

    res.status(200).json({ message: 'Progress updated', progress: updateData });
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
};