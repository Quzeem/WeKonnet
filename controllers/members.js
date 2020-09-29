const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middlewares/asyncHandler');
const Member = require('../models/Member');
const Organization = require('../models/Organization');

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
