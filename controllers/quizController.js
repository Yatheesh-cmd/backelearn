const Quiz = require('../models/Quiz');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const mongoose = require('mongoose');

exports.createQuiz = async (req, res) => {
  const { courseId, lessonId } = req.params;
  const { title, questions, showResultsImmediately } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(lessonId)) {
      return res.status(400).json({ message: 'Invalid course or lesson ID' });
    }

    const course = await Course.findById(courseId).populate('lessons');
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (course.instructor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to add quizzes to this course' });
    }

    const lessonExists = course.lessons.some(lesson => lesson._id.toString() === lessonId);
    if (!lessonExists) {
      return res.status(400).json({ message: 'Lesson not found in this course' });
    }

    if (!title || !questions) {
      return res.status(400).json({ message: 'Title and questions are required' });
    }

    let parsedQuestions;
    try {
      parsedQuestions = typeof questions === 'string' ? JSON.parse(questions) : questions;
      if (!Array.isArray(parsedQuestions)) {
        return res.status(400).json({ message: 'Questions must be an array' });
      }
    } catch (error) {
      return res.status(400).json({ message: 'Invalid questions format' });
    }

    for (const q of parsedQuestions) {
      if (!q.question || !q.options || !Array.isArray(q.options) || q.options.length < 2 || !q.correctAnswer || !q.options.includes(q.correctAnswer)) {
        return res.status(400).json({ message: 'Each question must have a question text, at least two options, and a valid correct answer' });
      }
    }

    const quiz = new Quiz({
      courseId,
      lessonId,
      title,
      questions: parsedQuestions,
      showResultsImmediately: showResultsImmediately === 'true' || showResultsImmediately === true,
    });
    await quiz.save();
    console.log('createQuiz: Created quiz:', JSON.stringify({ _id: quiz._id, courseId, lessonId, title }, null, 2));

    course.quizzes.push(quiz._id);
    await course.save();
    console.log('createQuiz: Updated course quizzes:', JSON.stringify(course.quizzes, null, 2));

    res.status(201).json({ message: 'Quiz created', quiz });
  } catch (error) {
    console.error('createQuiz: Error:', error.stack);
    res.status(500).json({ message: error.message || 'Server error during quiz creation' });
  }
};

exports.getQuiz = async (req, res) => {
  const { quizId } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({ message: 'Invalid quiz ID' });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const course = await Course.findById(quiz.courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (course.instructor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to view this quiz' });
    }

    res.status(200).json({ quiz });
  } catch (error) {
    console.error('getQuiz: Error:', error.stack);
    res.status(500).json({ message: error.message || 'Server error during quiz fetch' });
  }
};

exports.updateQuiz = async (req, res) => {
  const { quizId } = req.params;
  const { title, questions, showResultsImmediately } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({ message: 'Invalid quiz ID' });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const course = await Course.findById(quiz.courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (course.instructor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to update this quiz' });
    }

    if (!title || !questions) {
      return res.status(400).json({ message: 'Title and questions are required' });
    }

    let parsedQuestions;
    try {
      parsedQuestions = typeof questions === 'string' ? JSON.parse(questions) : questions;
      if (!Array.isArray(parsedQuestions)) {
        return res.status(400).json({ message: 'Questions must be an array' });
      }
    } catch (error) {
      return res.status(400).json({ message: 'Invalid questions format' });
    }

    for (const q of parsedQuestions) {
      if (!q.question || !q.options || !Array.isArray(q.options) || q.options.length < 2 || !q.correctAnswer || !q.options.includes(q.correctAnswer)) {
        return res.status(400).json({ message: 'Each question must have a question text, at least two options, and a valid correct answer' });
      }
    }

    quiz.title = title;
    quiz.questions = parsedQuestions;
    quiz.showResultsImmediately = showResultsImmediately === 'true' || showResultsImmediately === true;
    await quiz.save();
    console.log('updateQuiz: Updated quiz:', JSON.stringify({ _id: quiz._id, title }, null, 2));

    res.status(200).json({ message: 'Quiz updated', quiz });
  } catch (error) {
    console.error('updateQuiz: Error:', error.stack);
    res.status(500).json({ message: error.message || 'Server error during quiz update' });
  }
};

exports.deleteQuiz = async (req, res) => {
  const { quizId } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({ message: 'Invalid quiz ID' });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const course = await Course.findById(quiz.courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (course.instructor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to delete this quiz' });
    }

    course.quizzes = course.quizzes.filter(q => q.toString() !== quizId);
    await course.save();
    console.log('deleteQuiz: Updated course quizzes:', JSON.stringify(course.quizzes, null, 2));

    await Quiz.deleteOne({ _id: quizId });
    console.log('deleteQuiz: Deleted quiz:', quizId);

    res.status(200).json({ message: 'Quiz deleted' });
  } catch (error) {
    console.error('deleteQuiz: Error:', error.stack);
    res.status(500).json({ message: error.message || 'Server error during quiz deletion' });
  }
};

exports.submitQuiz = async (req, res) => {
  const { courseId, lessonId, quizId } = req.params;
  const { answers } = req.body;

  try {
    console.log('submitQuiz: Request params:', { courseId, lessonId, quizId });
    console.log('submitQuiz: Request body:', { answers });

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: 'Invalid course ID' });
    }
    if (!mongoose.Types.ObjectId.isValid(lessonId)) {
      return res.status(400).json({ message: 'Invalid lesson ID' });
    }
    if (!mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({ message: 'Invalid quiz ID' });
    }

    // Fetch quiz
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      console.log('submitQuiz: Quiz not found for quizId:', quizId);
      return res.status(404).json({ message: 'Quiz not found' });
    }
    console.log('submitQuiz: Quiz fetched:', quiz);

    // Verify quiz belongs to the provided lesson and course
    if (!quiz.courseId) {
      console.log('submitQuiz: Quiz missing courseId:', quiz);
      return res.status(400).json({ message: 'Quiz is missing courseId' });
    }
    if (!quiz.lessonId) {
      console.log('submitQuiz: Quiz missing lessonId:', quiz);
      return res.status(400).json({ message: 'Quiz is missing lessonId' });
    }
    if (quiz.courseId.toString() !== courseId) {
      console.log('submitQuiz: Course ID mismatch:', { quizCourseId: quiz.courseId.toString(), providedCourseId: courseId });
      return res.status(400).json({ message: 'Quiz does not belong to the specified course' });
    }
    if (quiz.lessonId.toString() !== lessonId) {
      console.log('submitQuiz: Lesson ID mismatch:', { quizLessonId: quiz.lessonId.toString(), providedLessonId: lessonId });
      return res.status(400).json({ message: 'Quiz does not belong to the specified lesson' });
    }

    // Validate answers
    if (!Array.isArray(answers)) {
      console.log('submitQuiz: Answers is not an array:', answers);
      return res.status(400).json({ message: 'Answers must be an array' });
    }
    if (answers.length !== quiz.questions.length) {
      console.log('submitQuiz: Answers length mismatch:', { answersLength: answers.length, questionsLength: quiz.questions.length });
      return res.status(400).json({ message: 'Answers array length must match the number of questions' });
    }

    // Check for invalid answers
    for (let i = 0; i < quiz.questions.length; i++) {
      if (!quiz.questions[i]) {
        console.log('submitQuiz: Invalid question at index:', i);
        return res.status(400).json({ message: `Invalid question at index ${i + 1}` });
      }
      if (!quiz.questions[i].options || !Array.isArray(quiz.questions[i].options)) {
        console.log('submitQuiz: Invalid options for question:', quiz.questions[i]);
        return res.status(400).json({ message: `Invalid options for question ${i + 1}` });
      }
      if (!answers[i] || !quiz.questions[i].options.includes(answers[i])) {
        console.log('submitQuiz: Invalid answer for question:', { questionIndex: i, answer: answers[i], options: quiz.questions[i].options });
        return res.status(400).json({ message: `Invalid answer for question ${i + 1}` });
      }
    }

    // Fetch enrollment
    const enrollment = await Enrollment.findOne({ studentId: req.user.id, courseId });
    if (!enrollment) {
      console.log('submitQuiz: Enrollment not found for studentId:', req.user.id, 'courseId:', courseId);
      return res.status(404).json({ message: 'Enrollment not found' });
    }
    console.log('submitQuiz: Enrollment fetched:', enrollment);

    // Calculate score and collect results
    let correctAnswers = 0;
    const results = quiz.questions.map((q, index) => {
      const isCorrect = answers[index] === q.correctAnswer;
      if (isCorrect) correctAnswers++;
      return {
        question: q.question,
        userAnswer: answers[index],
        correctAnswer: q.correctAnswer,
        isCorrect,
      };
    });
    const score = (correctAnswers / quiz.questions.length) * 100;

    // Update enrollment progress
    const progressIndex = enrollment.progress.findIndex(p => p.lessonId && p.lessonId.toString() === lessonId);
    if (progressIndex === -1) {
      enrollment.progress.push({ lessonId, watched: false, quizScore: score });
    } else {
      enrollment.progress[progressIndex].quizScore = score;
    }
    await enrollment.save();
    console.log('submitQuiz: Enrollment updated with score:', score);

    res.status(200).json({
      message: 'Quiz submitted',
      score,
      results,
      showResultsImmediately: quiz.showResultsImmediately,
    });
  } catch (error) {
    console.error('submitQuiz: Error:', error.stack);
    res.status(500).json({ message: error.message || 'Server error during quiz submission' });
  }
};
