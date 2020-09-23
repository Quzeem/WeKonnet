const express = require('express');
const {
  getOrganizations,
  getOrganization,
  createOrganization,
  updateOrganization,
  deleteOrganization,
} = require('../controllers/organizations');

const Organization = require('../models/Organization');
const advancedQuery = require('../middlewares/advancedQuery');

// Members Router
const membersRouter = require('./members');

const router = express.Router();

// Re-route into members router
router.use('/', membersRouter);

router
  .route('/')
  .get(advancedQuery(Organization), getOrganizations)
  .post(createOrganization);

router
  .route('/:id')
  .get(getOrganization)
  .put(updateOrganization)
  .delete(deleteOrganization);

module.exports = router;
