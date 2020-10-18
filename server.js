const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const cors = require('cors');
const colors = require('colors');
const errorHandler = require('./middleware/errorHandler');
const connectDB = require('./config/database');
const { connectCloudinary } = require('./config/cloudinary');

// Load enviroment variables
dotenv.config({ path: './config/config.env' });

// Connect to database
connectDB();

// Connect to cloudinary
connectCloudinary();

// Route files
const auth = require('./routes/auth');
const organizations = require('./routes/organizations');
const members = require('./routes/members');

// Express application
const app = express();

app.use(express.static(path.join(__dirname, 'client')));

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(logger('dev'));
}

// Prevent NoSQL Injections (sanitize data)
app.use(mongoSanitize());

// Set security headers
app.use(helmet());

// Prevent XSS attacks (sanitize user's inputs)
app.use(xss());

// Requests Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100,
});
app.use(limiter);

// Prevent http param pollution
app.use(hpp());

// Enable CORS
app.use(cors());

// Mount routers
app.use('/api/v1/auth', auth);
app.use('/api/v1/organizations', organizations);
app.use('/api/v1/members', members);

// Custom Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

const server = app.listen(
  PORT,
  console.log(
    `Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow
      .bold
  )
);

// Global handler for unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`.red);
  // Close server & exit process with failure
  server.close(() => process.exit(1));
});
