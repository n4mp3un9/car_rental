const express = require('express');
const router = express.Router();
const rentalController = require('../controllers/rental.controller');
const { authenticateToken, isShop, isCustomer, deriveShopIdFromCar,checkBlacklist } = require('../middleware');

// === สำหรับลูกค้า ===
router.post('/customer/cars/:carId/book', authenticateToken, isCustomer, rentalController.createRental);
router.get('/customer/rentals', authenticateToken, isCustomer, rentalController.getCustomerRentals);
router.get('/customer/rentals/:rentalId', authenticateToken, isCustomer, rentalController.getRentalDetails);
router.post('/customer/rentals/:rentalId/cancel', authenticateToken, isCustomer, rentalController.cancelRental);
router.post('/customer/rentals/:rentalId/return', authenticateToken, isCustomer, rentalController.requestCarReturn);

// === สำหรับร้านเช่ารถ ===
router.get('/shop/rentals', authenticateToken, isShop, rentalController.getShopRentals);
router.get('/shop/rentals/:rentalId', authenticateToken, isShop, rentalController.getShopRentalDetails);
router.put('/shop/rentals/:rentalId/status', authenticateToken, isShop, rentalController.updateRentalStatus);
router.get('/shop/rentals/pending', authenticateToken, isShop, rentalController.getPendingRentals);
router.get('/shop/bookings/pending', authenticateToken, isShop, rentalController.getPendingBookings);
router.post('/shop/rentals/:rentalId/approve', authenticateToken, isShop, rentalController.approveRental);
router.post('/shop/bookings/:id/approve', authenticateToken, isShop, rentalController.approveBooking);
router.get('/shop/returns', authenticateToken, isShop, rentalController.getReturnRequests);
router.post('/shop/rentals/:rentalId/approve-return', authenticateToken, isShop, rentalController.approveCarReturn);

module.exports = router;