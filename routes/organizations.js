const express = require('express');
const {
  getOrganizations,
  getOrganization,
  createOrganization,
  updateOrganization,
  deleteOrganization,
} = require('../controllers/organizations');

// Members Router
const membersRouter = require('./members');

const router = express.Router();

// Re-route into members router
router.use('/', membersRouter);

router.route('/').get(getOrganizations).post(createOrganization);

router
  .route('/:id')
  .get(getOrganization)
  .put(updateOrganization)
  .delete(deleteOrganization);

module.exports = router;
