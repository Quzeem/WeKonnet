const crypto = require('crypto');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middlewares/asyncHandler');
const Organization = require('../models/Organization');
const sendToken = require('../utils/sendToken');
const sendEmail = require('../utils/sendEmail');

/**
 * @description Get all organizations
 * @route GET /api/v1/organizations
 * @access Private/Admin
 */
exports.getOrganizations = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

/**
 * @description Get an organization
 * @route GET /api/v1/organizations/:organizationId
 * @access Private/Admin
 */
exports.getOrganization = asyncHandler(async (req, res, next) => {
  const organization = await Organization.findById(req.params.id);

  if (!organization) {
    return next(
      new ErrorResponse(`Organization with the ID: ${req.params.id} not found`),
      404
    );
  }

  return res.status(200).json({
    success: true,
    data: organization,
  });
});

/**
 * @description Delete organization
 * @route DELETE /api/v1/organizations/:organizationId
 * @access Private/Admin
 */
exports.deleteOrganization = asyncHandler(async (req, res, next) => {
  const organization = await Organization.findById(req.params.id);

  if (!organization) {
    return next(
      new ErrorResponse(`Organization with the ID: ${req.params.id} not found`),
      404
    );
  }
  // Trigger cascade delete of members associated with this organization
  organization.remove();

  return res.status(200).json({
    success: true,
    data: {},
  });
});

/**
 * @description Get logged in organization
 * @route GET /api/v1/organizations/me
 * @access Private (organization)
 */
exports.getLoggedInOrganization = asyncHandler(async (req, res, next) => {
  const organization = await Organization.findById(req.user._id);
  res.status(200).json({ success: true, data: organization });
});

/**
 * @description Details update for logged in organization
 * @route PUT /api/v1/organizations/updatedetails
 * @access Private (organization)
 */
exports.updateOrganizationDetails = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    name: req.body.name,
    username: req.body.username,
    email: req.body.email,
    location: req.body.location,
    phone: req.body.phone,
  };

  const organization = await Organization.findByIdAndUpdate(
    req.user._id,
    fieldsToUpdate,
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({ success: true, data: organization });
});

/**
 * @description Password update for logged in organization
 * @route PUT /api/v1/organizations/updatepassword
 * @access Private (organization)
 */
exports.updateOrganizationPassword = asyncHandler(async (req, res, next) => {
  const organization = await Organization.findById(req.user._id).select(
    '+password'
  );

  // Check current password
  if (!(await organization.verifyPassword(req.body.currentPassword))) {
    return next(new ErrorResponse('Incorrect password', 401));
  }

  // else
  organization.password = req.body.newPassword;
  await organization.save();

  return sendToken(organization, 200, res);
});

/**
 * @description Forgot password
 * @route POST /api/v1/organizations/forgotpassword
 * @access Public (organization)
 */
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  // Check if user exists
  const organization = await Organization.findOne({ email: req.body.email });

  if (!organization) {
    return next(
      new ErrorResponse('There is no organization with that email address', 404)
    );
  }

  // Get original reset token
  const resetToken = organization.getResetPasswordToken();

  // save user
  await organization.save({ validateBeforeSave: false });

  // Email Part

  // Create reset password url
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/organizations/resetpassword/${resetToken}`;

  // Message body
  const message = `Hello,\n\n ${organization.name}, \n\n\n You are receiving this email because you (or someone else) has requested the reset of a password.\n\n Please visit the link below to reset your password: \n\n ${resetUrl} \n\n\n If you did not make this request, kindly ignore this email. \n\n\n\n Cheers, \n\n Konnet`;

  try {
    // sending email
    await sendEmail({
      email: organization.email,
      subject: 'Password Reset Link',
      body: message,
    });

    // send response
    return res.status(200).json({ success: true, data: 'Email sent' });
  } catch (err) {
    organization.resetPasswordToken = undefined;
    organization.resetPasswordExpires = undefined;

    await organization.save({ validateBeforeSave: false });

    return next(new ErrorResponse('Email could not be sent', 500));
  }
});

/**
 * @description Reset password
 * @route PUT /api/v1/organizations/resetpassword/:resettoken
 * @access Public (organization)
 */
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // Create hash token from resettoken
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  // find an organization with the resetPasswordToken in the DB
  const organization = await Organization.findOne({
    resetPasswordToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!organization) {
    return next(new ErrorResponse('Invalid token', 400));
  }

  // else
  organization.password = req.body.password;
  organization.resetPasswordToken = undefined;
  organization.resetPasswordExpires = undefined;
  await organization.save();

  return sendToken(organization, 200, res);
});
