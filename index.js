const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cors = require('cors');
const path = require('path');

dotenv.config();
connectDB();

const app = express();

app.use(cors({
  origin: 'https://e-learning-platform-iota-two.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], 
  allowedHeaders: ['Content-Type', 'Authorization'], 
  credentials: true, 
}));

app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'Uploads')));
app.use('/auth', require('./routes/auth'));
app.use('/courses', require('./routes/courses'));
app.use('/lessons', require('./routes/lessons'));
app.use('/assignments', require('./routes/assignments'));
app.use('/enrollments', require('./routes/enrollments'));
app.use('/notifications', require('./routes/notifications'));
app.use('/admin', require('./routes/admin'));
app.use('/quiz', require('./routes/quiz'));
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT;
if (!PORT) {
  console.error('PORT environment variable is not set. Exiting...');
  process.exit(1);
}
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
