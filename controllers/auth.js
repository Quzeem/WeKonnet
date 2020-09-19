const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middlewares/asyncHandler');
const Organization = require('../models/Organization');

// @desc      Register Organization
// @route     POST /api/v1/auth/register
// @access    Public
exports.register = asyncHandler(async (req, res, next) => {
  const organization = await Organization.create(req.body);
  res.status(201).json({ success: true, data: organization });
});

// @desc      Login
// @route     POST /api/v1/auth/organizations/login
// @access    Public
exports.login = asyncHandler(async (req, res, next) => {
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

  // Validate organization
  if (!organization) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // check if password matches
  if (organization.password !== password) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  return res.status(200).json({ success: true });
});
