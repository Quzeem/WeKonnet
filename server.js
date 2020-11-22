const dotenv = require('dotenv');
const logger = require('./utils/winstonLogger');

process.on('uncaughtException', (err) => {
  logger.error(`Error: ${err.stack}`);
  process.exit(1);
});

// Load enviroment variables
dotenv.config({ path: './config/config.env' });

const connectDB = require('./config/database');
const { connectCloudinary } = require('./config/cloudinary');
const app = require('./app');

// Connect to database
connectDB();

// Connect to cloudinary
connectCloudinary();

const PORT = process.env.PORT || 3000;

const server = app.listen(
  PORT,
  logger.info(
    `Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`
  )
);

// Global handler for unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Error: ${err.message}`);
  // Close server & exit process with failure
  server.close(() => process.exit(1));
});
