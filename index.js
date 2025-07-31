const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cors = require('cors');
const path = require('path');

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'Uploads')));

app.use('/auth', require('./routes/auth'));
app.use('/courses', require('./routes/courses'));
app.use('/lessons', require('./routes/lessons'));
app.use('/assignments', require('./routes/assignments'));
app.use('/enrollments', require('./routes/enrollments'));
app.use('/notifications', require('./routes/notifications'));
app.use('/admin', require('./routes/admin'));
app.use('/quiz', require('./routes/quiz'));

const PORT = process.env.PORT; 
if (!PORT) {
  console.error('PORT environment variable is not set. Exiting...');
  process.exit(1);
}
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});