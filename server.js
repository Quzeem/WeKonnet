const express = require('express');
const dotenv = require('dotenv');
const logger = require('morgan');
const colors = require('colors');

// Load enviroment variables
dotenv.config({ path: './config/config.env' });

// Express application
const app = express();

// Body parser
app.use(express.json());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(logger('dev'));
}

const PORT = process.env.PORT || 3000;

app.listen(
  PORT,
  console.log(
    `Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow
      .bold
  )
);
