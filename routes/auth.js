const express = require('express');
const router = express.Router();
const { register, login, verifyEmail, resendCode } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.post('/resend-code', resendCode);

module.exports = router;