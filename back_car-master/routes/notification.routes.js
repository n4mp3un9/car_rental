const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { authenticateToken, isShop,authOptional } = require('../middleware');

// ใช้ middleware authenticateToken และ isShop กับทุก route ในไฟล์นี้

// Routes for shop notifications
router.get('/bookings/pending', notificationController.getPendingBookings);
router.get('/pending-payments', notificationController.getPendingPayments);
router.get('/returns', notificationController.getReturnRequests);
router.get('/cancellations', authenticateToken, isShop, notificationController.getShopCancellations);
router.post('/cancellations/:id/acknowledge', authenticateToken, isShop, notificationController.acknowledgeCancellation);

module.exports = router;