const path = require('path');
const DatauriParser = require('datauri/parser');
const ErrorResponse = require('./errorResponse');
const { uploader } = require('../config/cloudinary');

// Instantiate parser
const parser = new DatauriParser();

exports.uploadAvatar = async (req, res, next) => {
  if (!req.file) {
    return next(new ErrorResponse('Please upload a file', 400));
  }

  try {
    // remove an existing image in cloudinary
    if (req.user.photoId) {
      await uploader.destroy(req.user.photoId);
    }
    // datauri format
    const image = parser.format(
      path.extname(req.file.originalname).toString(),
      req.file.buffer
    ).content;

    // Upload an image to cloudinary
    const result = await uploader.upload(image, {
      folder: 'konnet',
    });

    // Update user photo field & photoId
    req.user.photo = result.secure_url;
    req.user.photoId = result.public_id;
    await req.user.save();

    return res.status(200).json({ success: true, data: result.secure_url });
  } catch (err) {
    return next(new ErrorResponse('Unable to upload image', 500));
  }
};
