const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middlewares/asyncHandler');
const Member = require('../models/Member');
const Organization = require('../models/Organization');

// @desc      Get all members
// @route     GET /api/v1/organizations/:organizationId/members
// @access    Private
exports.getMembers = asyncHandler(async (req, res, next) => {
  const members = await Member.find({
    organization: req.params.organizationId,
  }).populate({
    path: 'organization',
    select: 'name email address',
  });

  res.status(200).json({
    success: true,
    count: members.length,
    data: members,
  });
});

// @desc      Get a member
// @route     GET /api/v1/members/:id
// @access    Private
exports.getMember = asyncHandler(async (req, res, next) => {
  const member = await Member.findById(req.params.id);

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

// @desc      Add new member
// @route     POST /api/v1/organizations/:organizationId/members
// @access    Private
exports.createMember = asyncHandler(async (req, res, next) => {
  // Add organizationId to member data coming from req.body
  req.body.organization = req.params.organizationId;

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

  const member = await Member.create(req.body);

  return res.status(200).json({
    success: true,
    data: member,
  });
});

// @desc      Update Member
// @route     PUT /api/members/:id
// @access    Private
exports.updateMember = asyncHandler(async (req, res, next) => {
  const member = await Member.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
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

// @desc      Delete Member
// @route     DELETE /api/members/:id
// @access    Private
exports.deleteMember = asyncHandler(async (req, res, next) => {
  const member = await Member.findByIdAndDelete(req.params.id);

  if (!member) {
    return next(
      new ErrorResponse(`Member with the ID: ${req.params.id} not found`),
      404
    );
  }

  return res.status(200).json({
    success: true,
    data: {},
  });
});
