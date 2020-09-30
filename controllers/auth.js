const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middlewares/asyncHandler');
const Organization = require('../models/Organization');
const Member = require('../models/Member');
const sendToken = require('../utils/sendToken');

/**
 * @description Register Organization
 * @route POST /api/v1/auth/register
 * @access Public
 */
exports.register = asyncHandler(async (req, res, next) => {
  const organization = await Organization.create(req.body);

  return sendToken(organization, 201, res);
});

/**
 * @description Login Organization
 * @route POST /api/v1/auth/organizations/login
 * @access Public
 */
exports.loginOrganization = asyncHandler(async (req, res, next) => {
  const { username, password } = req.body;

  // Validate email & password
  if (!username || !password) {
    return next(
      new ErrorResponse('Please provide a username and password', 400)
    );
  }

  // Check if organization exists
  const organization = await Organization.findOne({ username }).select(
    '+password'
  );

  if (!organization) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Verify password
  const isMatch = await organization.verifyPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  return sendToken(organization, 200, res);
});

/**
 * @description Login Member
 * @route POST /api/v1/auth/members/login
 * @access Public
 */
exports.loginMember = asyncHandler(async (req, res, next) => {
  const { phone, password } = req.body;

  // Validate email & password
  if (!phone || !password) {
    return next(
      new ErrorResponse('Please provide a phone number and password', 400)
    );
  }

  // Check if member exists
  const member = await Member.findOne({ phone }).select('+password');

  // Validate member
  if (!member) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Verify password
  const isMatch = await member.verifyPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  return sendToken(member, 200, res);
});

/**
 * @description Logout
 * @route POST /api/v1/auth/logout
 * @access Public
 */
exports.logout = asyncHandler(async (req, res, next) => {
  res.cookie('token', '', {
    expires: new Date(Date.now() + 1 * 1000),
    httpOnly: true,
  });
  res.sendStatus(204);
});
