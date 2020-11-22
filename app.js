const fs = require('fs');
const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');
const ErrorResponse = require('./utils/errorResponse');

// Load enviroment variables
dotenv.config({ path: './config/config.env' });

// Route files
const auth = require('./routes/auth');
const organizations = require('./routes/organizations');
const members = require('./routes/members');

// Express application
const app = express();

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// app logs
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, 'logs', 'access.log'),
  { flags: 'a' }
);
app.use(morgan('combined', { stream: accessLogStream }));

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
  message:
    'Too many requests from this IP address, please try again in 10 minutes!',
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

// Handle undefined endpoints
app.all('*', (req, res, next) => {
  next(
    new ErrorResponse(`${req.originalUrl} not available on this server!`, 404)
  );
});

// Custom Error Handler
app.use(errorHandler);

module.exports = app;
