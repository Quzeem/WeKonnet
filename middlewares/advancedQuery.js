const mongoose = require('mongoose');

const advancedQuery = (model, populate) => async (req, res, next) => {
  let query;

  // Make a copy of req.query
  const reqQuery = { ...req.query };

  // Query params to be excluded as fields to match in DB for filtering
  const removedParams = ['select', 'sort', 'page', 'limit'];

  // remove excluded query params from query string
  removedParams.forEach((param) => delete reqQuery[param]);

  // Create query string after removing excluded query params
  const queryStr = JSON.stringify(reqQuery);

  // Finding resource
  if (model === mongoose.model('Organization')) {
    query = model.find(JSON.parse(queryStr));
  } else if (model === mongoose.model('Member')) {
    if (req.params.organizationId.match(/^[0-9a-fA-F]{24}$/)) {
      query = model.find({
        organizations: req.params.organizationId,
      });
    } else {
      return res.status(400).json({
        success: false,
        error: `Organization with the ID: ${req.params.organizationId} not found`,
      });
    }
  }

  // Select Fields
  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
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
  const totalDocs = await model.countDocuments();

  query = query.skip(startIndex).limit(limit);

  // Check for populate argument
  if (populate) {
    query = query.populate(populate);
  }

  // Executing query
  const results = await query;

  // Pagination Result
  const pagination = {};
  // show/hide next logic
  if (endIndex < totalDocs) {
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

  // add advancedResults object as a property to response object
  res.advancedResults = {
    success: true,
    count: results.length,
    pagination,
    data: results,
  };

  // call the next function in the application request-response cycle
  next();
};

module.exports = advancedQuery;
