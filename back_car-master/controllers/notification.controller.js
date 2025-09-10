// server/controllers/notification.controller.js
const db = require('../models/db');

// Helper function to build the common query
const getBaseRentalQuery = () => {
  return `
    FROM rentals r
    JOIN cars c ON r.car_id = c.id
    JOIN users u ON r.customer_id = u.id
    WHERE r.shop_id = ?
  `;
};

// 1. ดึงรายการจองที่รออนุมัติ (Pending Bookings)
const getPendingBookings = async (req, res) => {
  try {
    const shopId = req.user.id;
     if (!shopId) {
      return res.status(401).json({ message: 'Unauthorized: Shop ID not found in token.' });
    }
    const query = `
      SELECT
        r.id, r.created_at, r.start_date, r.end_date, r.rental_status, r.payment_status, r.total_amount,
        c.brand, c.model, c.year, c.license_plate, c.image_url,
        u.username AS customer_name, u.email AS customer_email, u.phone AS customer_phone
      ${getBaseRentalQuery()}
      AND r.rental_status = 'pending'
      ORDER BY r.created_at DESC
    `;
    const bookings = await db.executeQuery(query, [shopId]);
    res.json({ bookings });
  } catch (err) {
    console.error('Error fetching pending bookings:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 2. ดึงรายการชำระเงินที่รอตรวจสอบ (Pending Payments)
const getPendingPayments = async (req, res) => {
  try {
    const shopId = req.user.id;
    if (!shopId) {
      return res.status(401).json({ message: 'Unauthorized: Shop ID not found in token.' });
    }
    const query = `
      SELECT
        p.id as payment_id, p.payment_status, p.payment_method, p.payment_date, p.proof_image, p.amount,
        r.id as rental_id, r.created_at, r.start_date, r.end_date, r.total_amount,
        c.brand, c.model, c.year, c.license_plate, c.image_url,
        u.username AS customer_name, u.email AS customer_email
      FROM payments p
      JOIN rentals r ON p.rental_id = r.id
      JOIN cars c ON r.car_id = c.id
      JOIN users u ON r.customer_id = u.id
      WHERE r.shop_id = ? AND p.payment_status = 'pending_verification'
      ORDER BY p.created_at DESC
    `;
    const payments = await db.executeQuery(query, [shopId]);
    res.json({ payments });
  } catch (err) {
    console.error('Error fetching pending payments:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 3. ดึงรายการที่ลูกค้าร้องขอคืนรถ (Return Requests)
const getReturnRequests = async (req, res) => {
  try {
    const shopId = req.user.id;
    if (!shopId) {
      return res.status(401).json({ message: 'Unauthorized: Shop ID not found in token.' });
    }
    const query = `
      SELECT
        r.id, r.created_at, r.start_date, r.end_date, r.total_amount,
        c.brand, c.model, c.year, c.license_plate, c.image_url,
        u.username AS customer_name, u.email AS customer_email
      ${getBaseRentalQuery()}
      AND r.rental_status = 'return_requested' -- สมมติว่ามีสถานะนี้
      ORDER BY r.updated_at DESC
    `;
     const returnRequests = await db.executeQuery(query, [shopId]);
    res.json({ returnRequests });
  } catch (err) {
    console.error('Error fetching return requests:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 4. ดึงรายการที่ถูกยกเลิก (Cancellation Notifications)
async function getShopCancellations(req, res) {
  try {
    const shopId = req.user.id; // Use req.user.id instead of req.query.shop_id
    if (!shopId) {
      return res.status(401).json({ message: 'Unauthorized: Shop ID not found in token.' });
    }

    const sql = `
      SELECT
        r.id,
        r.created_at,
        r.start_date,
        r.end_date,
        r.total_amount,
        c.brand,
        c.model,
        c.year,
        c.license_plate,
        c.image_url,
        u.username AS customer_name,
        u.email AS customer_email
      FROM rentals r
      JOIN cars c ON r.car_id = c.id
      JOIN users u ON r.customer_id = u.id
      WHERE r.shop_id = ?
        AND r.rental_status = 'cancelled'
        AND r.shop_acknowledged_at IS NULL
      ORDER BY r.updated_at DESC
    `;

    const rows = await db.executeQuery(sql, [shopId]);
    return res.json({ cancellations: rows });
  } catch (err) {
    console.error('getShopCancellations error:', err);
    return res.status(500).json({ message: 'Failed to fetch cancellations' });
  }
}

async function acknowledgeCancellation(req, res) {
  try {
    const rentalId = Number(req.params.id);
    const shopId = req.user.id; // Use req.user.id instead of req.query.shop_id
    if (!rentalId) return res.status(400).json({ message: 'Missing id' });
    if (!shopId) return res.status(401).json({ message: 'Unauthorized: Shop ID not found in token.' });

    const found = await db.executeQuery(
      `SELECT id FROM rentals
        WHERE id = ? AND shop_id = ? AND rental_status = 'cancelled'
        LIMIT 1`,
      [rentalId, shopId]
    );
    if (!found.length) return res.status(404).json({ message: 'Not found' });

    await db.executeQuery(
      `UPDATE rentals
          SET shop_acknowledged_at = NOW(), updated_at = NOW()
        WHERE id = ?`,
      [rentalId]
    );
    return res.json({ success: true });
  } catch (err) {
    console.error('acknowledgeCancellation error:', err);
    return res.status(500).json({ message: 'Failed to acknowledge cancellation' });
  }
}


module.exports = {
  getPendingBookings,
  getPendingPayments,
  getReturnRequests,
  getShopCancellations,
  acknowledgeCancellation,
};