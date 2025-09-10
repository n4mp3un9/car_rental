const express = require('express');
const router = express.Router();
const { authenticateToken, isShop } = require('../middleware');
const {
  searchCustomers,
  getBlacklist,
  addToBlacklistHandler,
  removeFromBlacklistHandler,
} = require('../controllers/blacklistController');

router.get('/', authenticateToken, isShop, getBlacklist);
router.post('/', authenticateToken, isShop, addToBlacklistHandler);
router.delete('/', authenticateToken, isShop, removeFromBlacklistHandler);
router.get('/search', authenticateToken, isShop, searchCustomers);

module.exports = router;