const { executeQuery, addToBlacklist, removeFromBlacklist, getBlacklistForShop } = require('../models/db');

// ค้นหาลูกค้า
const searchCustomers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Query required' });
    }

    const results = await executeQuery(
      'SELECT id, username, email FROM users WHERE role = "customer" AND (username LIKE ? OR email LIKE ?)',
      [`%${query}%`, `%${query}%`]
    );
    return res.json(results);
  } catch (err) {
    console.error('Search customers error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ดึงรายการ blacklist ของร้าน
const getBlacklist = async (req, res) => {
  try {
    const shopId = req.user.userId;
    const blacklist = await getBlacklistForShop(shopId);
    return res.json(blacklist);
  } catch (err) {
    console.error('Get blacklist error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// เพิ่มลูกค้าเข้า blacklist
const addToBlacklistHandler = async (req, res) => {
  try {
    const shopId = req.user.userId;
    const { customerId, reason } = req.body;
    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID required' });
    }
    await addToBlacklist(shopId, Number(customerId), reason);
    return res.status(201).json({ message: 'Added to blacklist' });
  } catch (err) {
    console.error('Add to blacklist error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ลบลูกค้าออกจาก blacklist
const removeFromBlacklistHandler = async (req, res) => {
  try {
    const shopId = req.user.userId;
    const { customerId } = req.body;
    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID required' });
    }
    await removeFromBlacklist(shopId, Number(customerId));
    return res.json({ message: 'Removed from blacklist' });
  } catch (err) {
    console.error('Remove from blacklist error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  searchCustomers,
  getBlacklist,
  addToBlacklistHandler,
  removeFromBlacklistHandler,
};