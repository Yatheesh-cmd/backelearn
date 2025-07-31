const express = require('express');
const router = express.Router();
const { authMiddleware, instructorMiddleware } = require('../middleware/auth');
const { createCourse, getAllCourses, getInstructorCourses, getCourseDetails, updateCourse, deleteCourse } = require('../controllers/courseController');
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) return cb(null, true);
    cb(new Error('Images only (JPEG/PNG)'));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post('/', authMiddleware, instructorMiddleware, upload.single('thumbnail'), createCourse);
router.get('/', authMiddleware, getAllCourses);
router.get('/instructor', authMiddleware, instructorMiddleware, getInstructorCourses);
router.get('/:id', authMiddleware, getCourseDetails);
router.put('/:id', authMiddleware, instructorMiddleware, upload.single('thumbnail'), updateCourse);
router.delete('/:id', authMiddleware, instructorMiddleware, deleteCourse);

module.exports = router;