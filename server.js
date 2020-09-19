const express = require('express');
const dotenv = require('dotenv');
const logger = require('morgan');
const colors = require('colors');
const errorHandler = require('./middlewares/errorHandler');
const connectDB = require('./config/database');

// Load enviroment variables
dotenv.config({ path: './config/config.env' });

// Connect to database
connectDB();

// Route files
const auth = require('./routes/auth');
const members = require('./routes/members');

// Express application
const app = express();

// Body parser
app.use(express.json());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(logger('dev'));
}

// Mount routers
app.use('/api/v1/auth', auth);
app.use(members);

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
