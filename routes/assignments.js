const express = require('express');
const router = express.Router();
const { authMiddleware, instructorMiddleware } = require('../middleware/auth');
const { submitAssignment, gradeAssignment, getAssignments } = require('../controllers/assignmentController');
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

router.post('/:courseId/:lessonId', authMiddleware, upload.single('file'), submitAssignment);
router.put('/:id', authMiddleware, instructorMiddleware, gradeAssignment);
router.get('/', authMiddleware, instructorMiddleware, getAssignments);

module.exports = router;