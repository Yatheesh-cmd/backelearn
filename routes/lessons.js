const express = require('express');
const router = express.Router();
const { authMiddleware, instructorMiddleware } = require('../middleware/auth');
const { createLesson, getInstructorCoursess, getLesson, updateLesson, deleteLesson, getProgress, updateProgress } = require('../controllers/lessonController');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'Uploads/'),
  filename: (req, file, cb) => cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /pdf|docx/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) return cb(null, true);
    cb(new Error('PDF or DOCX only'));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post('/:courseId', authMiddleware, instructorMiddleware, upload.array('resources'), createLesson);
router.get('/instructor', authMiddleware, instructorMiddleware, getInstructorCoursess);
router.get('/:lessonId', authMiddleware, instructorMiddleware, getLesson);
router.put('/:lessonId', authMiddleware, instructorMiddleware, upload.array('resources'), updateLesson);
router.delete('/:lessonId', authMiddleware, instructorMiddleware, deleteLesson);
router.get('/progress/:courseId/:lessonId', authMiddleware, getProgress);
router.put('/progress/:courseId/:lessonId', authMiddleware, updateProgress);

module.exports = router;