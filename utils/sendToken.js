require('dotenv').config({ path: '../config/config.env' });

// Custom function which sets token for a user, puts the token in a cookie, and sends a response
const sendToken = async (user, statusCode, res) => {
  // Create token
  const token = await user.getAuthToken();
  // cookie options
  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({ success: true, data: user });
};

module.exports = sendToken;
