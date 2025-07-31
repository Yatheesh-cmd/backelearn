const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authMiddleware, instructorMiddleware } = require('../middleware/auth');
const { createQuiz, updateQuiz, deleteQuiz, submitQuiz, getQuiz } = require('../controllers/quizController');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/:courseId/:lessonId', authMiddleware, instructorMiddleware, upload.none(), createQuiz);
router.get('/:quizId', authMiddleware, instructorMiddleware, getQuiz);
router.put('/:quizId', authMiddleware, instructorMiddleware, upload.none(), updateQuiz);
router.delete('/:quizId', authMiddleware, instructorMiddleware, deleteQuiz);
router.post('/submit/:courseId/:lessonId/:quizId', authMiddleware, submitQuiz);

module.exports = router;