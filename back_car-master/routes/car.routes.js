// server/routes/car.routes.js
const express = require('express');
const router = express.Router();

const {
  addCar,
  getShopCars,
  getFeaturedCars,
  searchCars,
  getCarById,
  getCarForCustomer,
  updateCar,
  updateCarStatus,
  deleteCar,
  getShopRentalHistory,
  getPopularCars,
  updateCarMainImage,  
  deleteCarMainImage,
  getShopDashboardStats 
  
} = require('../controllers/car.controller');

const { authenticateToken, isShop,authOptional  } = require('../middleware');
const { upload } = require('../middlewares/upload.middleware.js'); 

router.put('/:carId/image', authenticateToken, isShop, upload.single('image'), updateCarMainImage);
router.delete('/:carId/image', authenticateToken, isShop, deleteCarMainImage);

// สำหรับ shop
router.get('/shop/dashboard', authenticateToken, isShop, getShopCars);
router.get('/rentals/history', authenticateToken, isShop, getShopRentalHistory);

// รถยอดนิยม
// ถ้าต้องการให้ทุกคนเรียกได้ (global) ให้ไม่ใส่ middleware
// controller จะดู req.user ถ้ามีและเป็น shop จะใช้ร้านนั้น, ถ้าไม่มีจะเป็น global
router.get('/popular', authenticateToken, getPopularCars);
router.get('/shop/dashboard-stats', authenticateToken, getShopDashboardStats);

// รถแนะนำ (public)
router.get('/featured', getFeaturedCars);

// ค้นหารถ (public)
router.get('/', authOptional, searchCars);

// สร้างรถ (shop เท่านั้น)
router.post('/', authenticateToken, isShop, addCar);

// อัปเดตรถ (shop เท่านั้น)
router.put('/:carId', authenticateToken, isShop, updateCar);
router.put('/:carId/status', authenticateToken, isShop, updateCarStatus);

// ดึงข้อมูลรถสำหรับลูกค้า (ต้อง login)
router.get('/:carId/customer', authOptional, authenticateToken, getCarForCustomer);

// ดึงรถตาม id (public)
router.get('/:carId', getCarById);

// ลบรถ (shop เท่านั้น)
router.delete('/:carId', authenticateToken, isShop, deleteCar);

module.exports = router;
