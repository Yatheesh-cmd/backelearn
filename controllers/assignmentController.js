const Assignment = require('../models/Assignment');
const Notification = require('../models/Notification');
const fs = require('fs');
const path = require('path');

exports.submitAssignment = async (req, res) => {
  const { courseId, lessonId } = req.params;
  const file = req.file?.filename;

  try {
    if (!file) return res.status(400).json({ message: 'File is required' });

    const assignment = new Assignment({
      courseId,
      lessonId,
      studentId: req.user.id,
      file,
    });
    await assignment.save();
    res.status(201).json({ message: 'Assignment submitted', assignment });
  } catch (error) {
    if (file) fs.unlinkSync(path.join(__dirname, '../Uploads', file));
    res.status(500).json({ message: error.message });
  }
};

exports.gradeAssignment = async (req, res) => {
  const { grade } = req.body;
  try {
    const assignment = await Assignment.findById(req.params.id).populate('lessonId', 'title');
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    const numericGrade = letterToGrade(grade);
    assignment.grade = grade;
    await assignment.save();

    const notification = new Notification({
      userId: assignment.studentId,
      type: 'assignment_graded',
      message: `Your assignment for lesson ${assignment.lessonId.title} has been graded: ${grade}`,
      lessonId: assignment.lessonId._id,
    });
    await notification.save();

    res.status(200).json({ message: 'Assignment graded', assignment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find()
      .populate('courseId', 'title')
      .populate('lessonId', 'title')
      .populate('studentId', 'username');
    res.status(200).json(assignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const letterToGrade = (letter) => {
  const gradeMap = { 'A': 95, 'B': 85, 'C': 75, 'D': 65, 'F': 50 };
  return gradeMap[letter] || 0;
};