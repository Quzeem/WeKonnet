const multer = require('multer');
const ErrorResposne = require('../utils/errorResponse');

require('dotenv').config({ path: '../config/config.env' });

// set storage engine
const storage = multer.memoryStorage();

// Set fileSize limit - 1MB
const limits = {
  fileSize: parseInt(process.env.MAX_FILE_UPLOAD, 10),
};

// Specify acceptable file type
const fileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    return cb(new ErrorResposne('Please upload an image file', 400));
  }
  // else accept the file
  return cb(null, true);
};

// Init upload middleware
const upload = multer({ storage, limits, fileFilter });

module.exports = upload;
