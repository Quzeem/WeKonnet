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

const router = express.Router();

// Include members router
const memberRouter = require('./members');

// Re-route into members router
router.use('/:organizationId/members', memberRouter);

router
  .route('/')
  .get(advancedQuery(Organization, 'members'), getOrganizations)
  .post(createOrganization);

router
  .route('/:id')
  .get(getOrganization)
  .put(updateOrganization)
  .delete(deleteOrganization);

module.exports = router;
