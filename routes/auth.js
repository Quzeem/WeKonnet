const express = require('express');
const {
  registerOrganization,
  loginOrganization,
  loginMember,
  registerAdmin,
  loginAdmin,
  logout,
} = require('../controllers/auth');

const { auth, authorize } = require('../middlewares/auth');

const router = express.Router();

router.post('/organizations/register', registerOrganization);
router.post('/organizations/login', loginOrganization);
router.post('/members/login', loginMember);
router.post('/admins/register', auth, authorize('admin'), registerAdmin);
router.post('/admins/login', loginAdmin);
router.get('/logout', logout);

module.exports = router;
