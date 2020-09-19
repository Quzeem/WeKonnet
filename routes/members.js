const express = require('express');
const {
  getMembers,
  getMember,
  createMember,
  updateMember,
  deleteMember,
} = require('../controllers/members');

const router = express.Router();

router
  .route('/api/v1/organizations/:organizationId/members')
  .get(getMembers)
  .post(createMember);

router
  .route('/api/v1/members/:id')
  .get(getMember)
  .put(updateMember)
  .delete(deleteMember);

module.exports = router;
