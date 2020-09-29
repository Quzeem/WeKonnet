const express = require('express');
const {
  getMembers,
  getMember,
  createMember,
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
      select: 'name',
    }),
    getMembers
  )
  .post(createMember);

router.route('/:memberId').get(getMember).delete(deleteMember);

module.exports = router;
