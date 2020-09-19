const Organization = require('../models/Organization');

// @desc      Register Organization
// @route     POST /api/v1/auth/register
// @access    Public
exports.register = async (req, res, next) => {
  try {
    const organization = await Organization.create(req.body);
    res.status(201).json({ success: true, data: organization });
  } catch (err) {
    res
      .status(400)
      .json({
        success: false,
        error: 'Duplicate field value entered or missing required fields',
      });
  }
};

// @desc      Login
// @route     POST /api/v1/auth/organizations/login
// @access    Public
exports.login = async (req, res, next) => {
  const { username, password } = req.body;

  // Validate email & password
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: 'Please provide a username and password',
    });
  }

  // Check if organization exists
  const organization = await Organization.findOne({ username }).select(
    '+password'
  );

  // Validate organization
  if (!organization) {
    return res
      .status(401)
      .json({ success: false, error: 'Invalid credentials' });
  }

  // check if password matches
  if (organization.password !== password) {
    return res
      .status(401)
      .json({ success: false, error: 'Invalid credentials' });
  }

  return res.status(200).json({ success: true });
};
