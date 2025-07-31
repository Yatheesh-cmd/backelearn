const express = require('express');
const router = express.Router();
const { authMiddleware, instructorMiddleware } = require('../middleware/auth');
const { createCourse, getAllCourses, getInstructorCourses, getCourseDetails, updateCourse, deleteCourse } = require('../controllers/courseController');
const multer = require('multer');
const path = require('path');


const imageStorage = multer.memoryStorage();
const imageUpload = multer({
  storage: imageStorage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) return cb(null, true);
    cb(new Error('Images only (JPEG/PNG)'));
  },
  limits: { fileSize: 5 * 1024 * 1024 }, 
});


const pdfStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'Uploads/'),
  filename: (req, file, cb) => cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`),
});
const pdfUpload = multer({
  storage: pdfStorage,
  fileFilter: (req, file, cb) => {
    const filetypes = /pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) return cb(null, true);
    cb(new Error('PDFs only'));
  },
  limits: { fileSize: 10 * 1024 * 1024 }, 
});

// Routes
router.post('/', authMiddleware, instructorMiddleware, imageUpload.single('thumbnail'), createCourse);
router.get('/', authMiddleware, getAllCourses);
router.get('/instructor', authMiddleware, instructorMiddleware, getInstructorCourses);
router.get('/:id', authMiddleware, getCourseDetails);
router.put('/:id', authMiddleware, instructorMiddleware, imageUpload.single('thumbnail'), updateCourse);
router.delete('/:id', authMiddleware, instructorMiddleware, deleteCourse);

module.exports = router;
module.exports.pdfUpload = pdfUpload; 