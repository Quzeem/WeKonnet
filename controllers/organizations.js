const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middlewares/asyncHandler');
const Organization = require('../models/Organization');

// @desc      Get all organizations
// @route     GET /api/v1/organizations
// @access    Private/Super Admin
exports.getOrganizations = asyncHandler(async (req, res, next) => {
  const organizations = await Organization.find();

  res.status(200).json({
    success: true,
    count: organizations.length,
    data: organizations,
  });
});

// @desc      Get an organization
// @route     GET /api/v1/organizations/:id
// @access    Private/Super Admin
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

// @desc      Add new organization
// @route     POST /api/v1/organizations
// @access    Private/Super Admin
exports.createOrganization = asyncHandler(async (req, res, next) => {
  const organization = await Organization.create(req.body);

  return res.status(200).json({
    success: true,
    data: organization,
  });
});

// @desc      Update organization
// @route     PUT /api/organizations/:id
// @access    Private/Super Admin
exports.updateOrganization = asyncHandler(async (req, res, next) => {
  const organization = await Organization.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

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

// @desc      Delete organization
// @route     DELETE /api/organizations/:id
// @access    Private/Super Admin
exports.deleteOrganization = asyncHandler(async (req, res, next) => {
  const organization = await Organization.findByIdAndDelete(req.params.id);

  if (!organization) {
    return next(
      new ErrorResponse(`Organization with the ID: ${req.params.id} not found`),
      404
    );
  }

  return res.status(200).json({
    success: true,
    data: {},
  });
});
