const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// All user routes require authentication
router.use(authenticateToken);

router.get('/', (req, res) => {
  res.json({ message: 'Users routes ready' });
});

// TODO: Add user profile endpoints

module.exports = router;