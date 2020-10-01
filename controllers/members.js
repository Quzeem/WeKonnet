const crypto = require('crypto');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middlewares/asyncHandler');
const Member = require('../models/Member');
const Organization = require('../models/Organization');
const sendToken = require('../utils/sendToken');
const sendEmail = require('../utils/sendEmail');

/**
 * @description Get all members
 * @route GET /api/v1/organizations/:organizationId/members
 * @access Private (organization & members)
 */
exports.getMembers = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

/**
 * @description Get a member
 * @route GET /api/v1/organizations/:organizationId/members/:memberId
 * @access Private (organization & members)
 */
exports.getMember = asyncHandler(async (req, res, next) => {
  // const member = await Member.findById(req.params.id);
  const member = await Member.findOne({
    _id: req.params.memberId,
    organizations: { $in: [req.params.organizationId] },
  });

  if (!member) {
    return next(
      new ErrorResponse(`Member with the ID: ${req.params.id} not found`),
      404
    );
  }

  return res.status(200).json({
    success: true,
    data: member,
  });
});

/**
 * @description Add a new member
 * @route POST /api/v1/organizations/:organizationId/members
 * @access Private (organization)
 */
exports.createMember = asyncHandler(async (req, res, next) => {
  // Check if organization exists
  const organization = await Organization.findById(req.params.organizationId);

  if (!organization) {
    return next(
      new ErrorResponse(
        `Organization with the ID: ${req.params.organizationId} not found`
      ),
      404
    );
  }

  try {
    // Create member
    req.body.organizations = [req.params.organizationId];

    const member = await Member.create(req.body);

    return res.status(201).json({
      success: true,
      data: member,
    });
  } catch (err) {
    if (err.code === 11000) {
      let member = await Member.findOne({
        phone: req.body.phone,
        organizations: req.params.organizationId,
      });

      if (!member) {
        member = await Member.findOneAndUpdate(
          { phone: req.body.phone },
          { $addToSet: { organizations: req.params.organizationId } },
          { new: true }
        );

        return res.status(201).json({
          success: true,
          data: member,
        });
      }

      return next(
        new ErrorResponse(
          `Member with the ID: ${member._id} already exists`,
          403
        )
      );
    }
  }
});

/**
 * @description Delete member
 * @route DELETE /api/v1/members/:memberId
 * @access Private (organization)
 */
exports.deleteMember = asyncHandler(async (req, res, next) => {
  const member = await Member.findByIdAndUpdate(
    req.params.memberId,
    {
      $pull: { organizations: req.query.organizationId },
    },
    { new: true }
  );

  if (!member) {
    return next(
      new ErrorResponse(`Member with the ID: ${req.params.memberId} not found`),
      404
    );
  }

  if (member.organizations.length === 0) {
    await member.remove();
  }

  return res.status(200).json({
    success: true,
    data: {},
  });
});

/**
 * @description Get logged in member
 * @route GET /api/v1/members/me
 * @access Private (member)
 */
exports.getLoggedInMember = asyncHandler(async (req, res, next) => {
  const member = await Member.findById(req.user._id);
  res.status(200).json({ success: true, data: member });
});

/**
 * @description Details update for logged in member
 * @route PUT /api/v1/members/updatedetails
 * @access Private (member)
 */
exports.updateMemberDetails = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    email: req.body.email,
    phone: req.body.phone,
    professionalSkills: req.body.professionalSkills,
    gender: req.body.gender,
    stateOfOrigin: req.body.stateOfOrigin,
    location: req.body.location,
  };

  const member = await Member.findByIdAndUpdate(req.user._id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, data: member });
});

/**
 * @description Password update for logged in member
 * @route PUT /api/v1/members/updatepassword
 * @access Private (member)
 */
exports.updateMemberPassword = asyncHandler(async (req, res, next) => {
  const member = await Member.findById(req.user._id).select('+password');

  // Check current password
  if (!(await member.verifyPassword(req.body.currentPassword))) {
    return next(new ErrorResponse('Incorrect password', 401));
  }

  // else
  member.password = req.body.newPassword;
  await member.save();

  return sendToken(member, 200, res);
});

/**
 * @description Forgot password
 * @route POST /api/v1/members/forgotpassword
 * @access Public (member)
 */
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  // Check if user exists
  const member = await Member.findOne({ email: req.body.email });

  if (!member) {
    return next(
      new ErrorResponse('There is no member with that email address', 404)
    );
  }

  // Get original reset token
  const resetToken = member.getResetPasswordToken();

  // save user
  await member.save({ validateBeforeSave: false });

  // Email Part

  // Create reset password url
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/members/resetpassword/${resetToken}`;

  // Message body
  const message = `Hi ${member.firstname} ${member.lastname}, \n\n You are receiving this email because you (or someone else) has requested the reset of a password.\n\n Please visit the link below to reset your password: \n\n ${resetUrl} \n\n If you did not make this request, kindly ignore this email. \n\n\n\n Cheers, \n\n Konnet`;

  try {
    // sending email
    await sendEmail({
      email: member.email,
      subject: 'Password Reset Link',
      body: message,
    });

    // send response
    return res.status(200).json({ success: true, data: 'Email sent' });
  } catch (err) {
    member.resetPasswordToken = undefined;
    member.resetPasswordExpires = undefined;

    await member.save({ validateBeforeSave: false });

    return next(new ErrorResponse('Email could not be sent', 500));
  }
});

/**
 * @description Reset password
 * @route PUT /api/v1/members/resetpassword/:resettoken
 * @access Public (member)
 */
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // Create hash token from resettoken
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  // find a member with the resetPasswordToken in the DB
  const member = await Member.findOne({
    resetPasswordToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!member) {
    return next(new ErrorResponse('Invalid token', 400));
  }

  // else
  member.password = req.body.password;
  member.resetPasswordToken = undefined;
  member.resetPasswordExpires = undefined;
  await member.save();

  return sendToken(member, 200, res);
});
