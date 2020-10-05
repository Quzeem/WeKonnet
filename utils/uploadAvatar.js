const ErrorResponse = require('./errorResponse');
const { uploader } = require('../config/cloudinary');

const uploadAvatar = async (req, res, next) => {
  if (!req.file) {
    return next(new ErrorResponse('Please upload a file', 400));
  }

  try {
    // Upload image to cloudinary
    const result = await uploader.upload(req.file.path, {
      folder: 'konnet',
    });

    // Update user photo field
    req.user.photo = result.secure_url;
    // save
    await req.user.save();
    return res.status(200).json({ success: true, data: result.secure_url });
  } catch (err) {
    return next(new ErrorResponse('Unable to upload image', 500));
  }
};

module.exports = uploadAvatar;
