const express = require('express');
const {
  getMembers,
  getMember,
  createMember,
  updateMember,
  deleteMember,
} = require('../controllers/members');

const Member = require('../models/Member');
const advancedQuery = require('../middlewares/advancedQuery');

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(
    advancedQuery(Member, {
      path: 'organization',
      select: 'name email address',
    }),
    getMembers
  )
  .post(createMember);

router.route('/:id').get(getMember).put(updateMember).delete(deleteMember);

module.exports = router;
