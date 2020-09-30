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
    authorize('admin', 'organization', 'member'),
    advancedQuery(Member, {
      path: 'organization',
      select: 'name',
    }),
    getMembers
  )
  .post(authorize('admin', 'organization'), createMember);

router
  .route('/:memberId')
  .get(authorize('admin', 'organization', 'member'), getMember)
  .delete(authorize('admin', 'organization'), deleteMember);

module.exports = router;
