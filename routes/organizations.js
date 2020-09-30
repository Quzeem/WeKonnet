const express = require('express');
const {
  getOrganizations,
  getOrganization,
  deleteOrganization,
} = require('../controllers/organizations');

const Organization = require('../models/Organization');
const advancedQuery = require('../middlewares/advancedQuery');
const { auth, authorize } = require('../middlewares/auth');

const router = express.Router();

// Include members router
const memberRouter = require('./members');

// Re-route into members router
router.use('/:organizationId/members', memberRouter);

// Use auth middleware in all routes
router.use(auth);
router.use(authorize('admin'));

router.route('/').get(advancedQuery(Organization, 'members'), getOrganizations);

router.route('/:id').get(getOrganization).delete(deleteOrganization);

module.exports = router;
