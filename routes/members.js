const express = require('express');
const {
  getMembers,
  getMember,
  createMember,
  deleteMember,
} = require('../controllers/members');

const Member = require('../models/Member');
const advancedQuery = require('../middlewares/advancedQuery');
const { auth, authorize } = require('../middlewares/auth');

const router = express.Router({ mergeParams: true });

// Use auth middleware in all routes
router.use(auth);

router
  .route('/')
  .get(
    authorize('organization', 'member'),
    advancedQuery(Member, {
      path: 'organization',
      select: 'name',
    }),
    getMembers
  )
  .post(authorize('organization'), createMember);

router
  .route('/:memberId')
  .get(authorize('organization', 'member'), getMember)
  .delete(authorize('organization'), deleteMember);

module.exports = router;
