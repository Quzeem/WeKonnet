const express = require('express');
const {
  register,
  loginOrganization,
  loginMember,
  logout,
} = require('../controllers/auth');

const router = express.Router();

router.post('/register', register);
router.post('/organizations/login', loginOrganization);
router.post('/members/login', loginMember);
router.get('/logout', logout);

module.exports = router;
