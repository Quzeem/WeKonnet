const express = require('express');
const {
  getOrganizations,
  getOrganization,
  deleteOrganization,
  getLoggedInOrganization,
  uploadAvatar,
  updateOrganizationDetails,
  updateOrganizationPassword,
  forgotPassword,
  resetPassword,
} = require('../controllers/organizations');

const Organization = require('../models/Organization');
const advancedQuery = require('../middleware/advancedQuery');
const { auth, authorize } = require('../middleware/auth');
const upload = require('../middleware/imageUpload');

const router = express.Router();

// Include members router
const memberRouter = require('./members');

// Re-route into members router
router.use('/:organizationId/members', memberRouter);

router.route('/').get(
  auth,
  authorize('admin'),
  advancedQuery(Organization, {
    path: 'members',
    select: 'firstname lastname phone email',
  }),
  getOrganizations
);

router.get('/me', auth, authorize('organization'), getLoggedInOrganization);
router
  .route('/avatar')
  .post(auth, authorize('organization'), upload.single('image'), uploadAvatar);
router.put(
  '/updatedetails',
  auth,
  authorize('organization'),
  updateOrganizationDetails
);
router.put(
  '/updatepassword',
  auth,
  authorize('organization'),
  updateOrganizationPassword
);

router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);

router
  .route('/:id')
  .get(auth, authorize('admin'), getOrganization)
  .delete(auth, authorize('admin'), deleteOrganization);

module.exports = router;
