const generator = require('generate-password');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middlewares/asyncHandler');
const Member = require('../models/Member');
const Organization = require('../models/Organization');
const sendToken = require('../utils/sendToken');
const {
  sendPasswordResetLink,
  changePassword,
} = require('../utils/passwordReset');
const { uploadAvatar } = require('../utils/avatar');

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
  const member = await Member.findOne({
    _id: req.params.memberId,
    organizations: { $in: [req.params.organizationId] },
  });

  if (!member) {
    return next(
      new ErrorResponse(`Member with the ID: ${req.params.memberId} not found`),
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
    req.body.organizations = [req.params.organizationId];

    // default password
    if (!req.body.password) {
      req.body.password = generator.generate({ length: 10, numbers: true });
    }

    const member = await Member.create(req.body);

    return res.status(201).json({
      success: true,
      data: member,
    });
  } catch (err) {
    if (err.code === 11000) {
      const member = await Member.findOne({
        phone: req.body.phone,
        organizations: req.params.organizationId,
      });

      // allow an existing member to be added by a new organization with thesame phone number
      if (!member) {
        const updatedMember = await Member.findOneAndUpdate(
          { phone: req.body.phone },
          { $addToSet: { organizations: req.params.organizationId } },
          { new: true }
        );

        return res.status(200).json({
          success: true,
          message: `Exisitng member with the ID: ${updatedMember._id} has been added to ${organization.name}`,
        });
      }

      return next(
        new ErrorResponse(
          'The phone number provided has already been used to register a member in this organization',
          403
        )
      );
    }
    return next(err);
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
  sendPasswordResetLink(Member, req, res, next);
});

/**
 * @description Reset password
 * @route PUT /api/v1/members/resetpassword/:resettoken
 * @access Public (member)
 */
exports.resetPassword = asyncHandler(async (req, res, next) => {
  changePassword(Member, req, res, next);
});

/**
 * @description Avatar upload for member
 * @route POST /api/v1/members/avatar
 * @access Private (member)
 */
exports.uploadAvatar = asyncHandler(async (req, res, next) => {
  uploadAvatar(req, res, next);
});
