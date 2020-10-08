const crypto = require('crypto');
const mongoose = require('mongoose');
const ErrorResponse = require('./errorResponse');
const sendToken = require('./sendToken');
const sendEmail = require('./sendEmail');

exports.sendPasswordResetLink = async (model, req, res, next) => {
  // Check if user exists
  const user = await model.findOne({ email: req.body.email });

  if (!user) {
    if (model === mongoose.model('Organization')) {
      return next(
        new ErrorResponse(
          'There is no organization with that email address',
          404
        )
      );
    }
    if (model === mongoose.model('Member')) {
      return next(
        new ErrorResponse('There is no member with that email address', 404)
      );
    }
  }

  // Get original reset token
  const resetToken = user.getResetPasswordToken();

  // save user
  await user.save({ validateBeforeSave: false });

  // Email Part
  let message;

  if (model === mongoose.model('Organization')) {
    // Create reset password url
    const resetUrl = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/organizations/resetpassword/${resetToken}`;

    // Message body
    message = `Hello,\n\n ${user.name}, \n\n\n You are receiving this email because you (or someone else) has requested the reset of a password.\n\n Please visit the link below to reset your password: \n\n ${resetUrl} \n\n\n If you did not make this request, kindly ignore this email. \n\n\n\n Cheers, \n\n Konnet`;
  } else if (model === mongoose.model('Member')) {
    // Create reset password url
    const resetUrl = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/members/resetpassword/${resetToken}`;

    // Message body
    message = `Hi ${user.firstname} ${user.lastname}, \n\n\n You are receiving this email because you (or someone else) has requested the reset of a password.\n\n Please visit the link below to reset your password: \n\n ${resetUrl} \n\n\n If you did not make this request, kindly ignore this email. \n\n\n\n Cheers, \n\n Konnet`;
  }

  try {
    // sending email
    await sendEmail({
      sender: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      reciever: user.email,
      subject: 'Password Reset Link',
      body: message,
    });

    // send response
    return res.status(200).json({ success: true, data: 'Email sent' });
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse('Email could not be sent', 500));
  }
};

exports.changePassword = async (model, req, res, next) => {
  // Create hash token from resettoken
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  // find an organization with the resetPasswordToken in the DB
  const user = await model.findOne({
    resetPasswordToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorResponse('Invalid token', 400));
  }

  // else
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  return sendToken(user, 200, res);
};
