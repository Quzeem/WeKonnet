const express = require('express');
const {
  getMembers,
  getMember,
  createMember,
  deleteMember,
  getLoggedInMember,
  uploadAvatar,
  updateMemberDetails,
  updateMemberPassword,
  forgotPassword,
  resetPassword,
  messageMember,
  messageMembers,
} = require('../controllers/members');

const Member = require('../models/Member');
const advancedQuery = require('../middlewares/advancedQuery');
const { auth, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/imageUpload');

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(
    auth,
    authorize('admin', 'organization', 'member'),
    advancedQuery(Member, {
      path: 'organization',
      select: 'name',
    }),
    getMembers
  )
  .post(auth, authorize('admin', 'organization'), createMember);

router.get('/me', auth, authorize('member'), getLoggedInMember);
router
  .route('/avatar')
  .post(auth, authorize('member'), upload.single('image'), uploadAvatar);
router.put('/updatedetails', auth, authorize('member'), updateMemberDetails);
router.put('/updatepassword', auth, authorize('member'), updateMemberPassword);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);
router.post(
  '/message/single',
  auth,
  authorize('admin', 'organization', 'member'),
  messageMember
);
router.post(
  '/message/all',
  auth,
  authorize('admin', 'organization'),
  messageMembers
);

router
  .route('/:memberId')
  .get(auth, authorize('admin', 'organization', 'member'), getMember)
  .delete(auth, authorize('admin', 'organization'), deleteMember);

module.exports = router;
