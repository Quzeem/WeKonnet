const jwt = require('jsonwebtoken');
const asyncHandler = require('./asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const Organization = require('../models/Organization');
const Member = require('../models/Member');

exports.auth = asyncHandler(async (req, res, next) => {
  //  Get token from req.cookies
  const { token } = req.cookies;

  // Make sure token exists
  if (!token) {
    return next(
      new ErrorResponse(
        'You need to be authenticated to access this route',
        401
      )
    );
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // set user value (currently logged in user)
    if (decoded.role === 'organization') {
      const organization = await Organization.findById(decoded._id);
      req.user = organization;
      next();
    } else if (decoded.role === 'member') {
      const member = await Member.findById(decoded._id);
      req.user = member;
      next();
    } else {
      return next(
        new ErrorResponse('You are not authorized to access this route', 401)
      );
    }
  } catch (err) {
    return next(
      new ErrorResponse(
        'You need to be authenticated to access this route',
        401
      )
    );
  }
});

// Grant access to specific roles
exports.authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(
      new ErrorResponse(
        `${req.user.role} not authorized to access this route`,
        401
      )
    );
  }
  next();
};
