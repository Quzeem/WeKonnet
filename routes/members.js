const express = require('express');
const {
  getMembers,
  getMember,
  createMember,
  updateMember,
  deleteMember,
} = require('../controllers/members');

const router = express.Router({ mergeParams: true });

router.route('/').get(getMembers).post(createMember);

router.route('/:id').get(getMember).put(updateMember).delete(deleteMember);

module.exports = router;
