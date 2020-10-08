const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middlewares/asyncHandler');
const Organization = require('../models/Organization');
const Member = require('../models/Member');
const sendToken = require('../utils/sendToken');
const {
  sendPasswordResetLink,
  changePassword,
} = require('../utils/passwordReset');
const { uploadAvatar } = require('../utils/avatar');

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

  // Delete members that doesn't belong to any organization
  await Member.deleteMany({
    organizations: { $size: 0 },
  });

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
  sendPasswordResetLink(Organization, req, res, next);
});

/**
 * @description Reset password
 * @route PUT /api/v1/organizations/resetpassword/:resettoken
 * @access Public (organization)
 */
exports.resetPassword = asyncHandler(async (req, res, next) => {
  changePassword(Organization, req, res, next);
});

/**
 * @description Avatar upload for organization
 * @route POST /api/v1/organizations/avatar
 * @access Private (organization)
 */
exports.uploadAvatar = asyncHandler(async (req, res, next) => {
  uploadAvatar(req, res, next);
});
