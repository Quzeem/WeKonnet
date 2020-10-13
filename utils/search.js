const escapeStringRegexp = require('escape-string-regexp');
const ErrorResponse = require('./errorResponse');
const Member = require('../models/Member');

const search = async (req, res, next) => {
  let query;

  // Make a copy of req.query
  const reqQuery = { ...req.query };

  // Query params to be excluded as fields to match in DB for filtering
  const removedParams = ['sort', 'page', 'limit'];

  // remove excluded query params from query string
  removedParams.forEach((param) => delete reqQuery[param]);

  // Query term
  const { term } = reqQuery;

  if (!term) {
    return next(new ErrorResponse('Please provide a search term', 400));
  }

  // Escape RegExp special characters.
  const $regex = escapeStringRegexp(term);

  try {
    // Finding
    if (req.user.role === 'member' && req.query.organizationId) {
      query = Member.find({
        $and: [
          {
            $or: [
              { firstname: { $regex, $options: 'i' } },
              { lastname: { $regex, $options: 'i' } },
              { state: { $regex, $options: 'i' } },
              { occupation: { $regex, $options: 'i' } },
            ],
          },
          { organizations: { $in: [req.query.organizationId] } },
        ],
      });
    } else if (req.user.role === 'member') {
      query = Member.find({
        $and: [
          {
            $or: [
              { firstname: { $regex, $options: 'i' } },
              { lastname: { $regex, $options: 'i' } },
              { state: { $regex, $options: 'i' } },
              { occupation: { $regex, $options: 'i' } },
            ],
          },
          { organizations: { $in: req.user.organizations } },
        ],
      });
    } else if (req.user.role === 'organization') {
      query = Member.find({
        $and: [
          {
            $or: [
              { firstname: { $regex, $options: 'i' } },
              { lastname: { $regex, $options: 'i' } },
              { state: { $regex, $options: 'i' } },
              { occupation: { $regex, $options: 'i' } },
            ],
          },
          { organizations: { $in: [req.user._id] } },
        ],
      });
    }

    // Sort Documents by field(s) --- Ascending(1) or Descending(-1)
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      // default sort using createdAt in descending order
      query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const totalDocs = await Member.countDocuments();

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const results = await query;

    // Pagination Result
    const pagination = {};
    // show/hide next logic
    if (endIndex < totalDocs && results.length !== 0) {
      pagination.next = {
        page: page + 1,
        limit,
      };
    }
    // show/hide prev logic
    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit,
      };
    }

    return res.status(200).json({
      success: true,
      count: results.length,
      pagination,
      data: results,
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = search;
