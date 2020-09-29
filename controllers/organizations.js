const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middlewares/asyncHandler');
const Organization = require('../models/Organization');

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
