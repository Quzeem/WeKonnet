const express = require('express');
const {
  getOrganizations,
  getOrganization,
  deleteOrganization,
  getLoggedInOrganization,
  updateOrganizationDetails,
  updateOrganizationPassword,
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

router
  .route('/')
  .get(
    authorize('admin'),
    advancedQuery(Organization, 'members'),
    getOrganizations
  );

router.get('/me', authorize('organization'), getLoggedInOrganization);
router.put(
  '/updatedetails',
  authorize('organization'),
  updateOrganizationDetails
);
router.put(
  '/updatepassword',
  authorize('organization'),
  updateOrganizationPassword
);

router
  .route('/:id')
  .get(authorize('admin'), getOrganization)
  .delete(authorize('admin'), deleteOrganization);

module.exports = router;
