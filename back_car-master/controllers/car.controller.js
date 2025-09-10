// server/controllers/car.controller.js
const db = require('../models/db');
const path = require('path');


function blacklistFilterForCustomer(req) {
  // ใช้เฉพาะตอน caller เป็นลูกค้าและมี id
  if (req.user?.role === 'customer' && req.user?.id) {
    return {
      clause: `
        AND NOT EXISTS (
          SELECT 1
          FROM blacklists b
          WHERE b.shop_id = c.shop_id
            AND b.customer_id = ?
        )
      `,
      params: [Number(req.user.id)],
    };
  }
  // ถ้าไม่ใช่ลูกค้า/ยังไม่ล็อกอิน ก็ไม่กรอง
  return { clause: '', params: [] };
}
// เพิ่มรถยนต์ใหม่
const addCar = async (req, res) => {
  try {
    const {
      brand, model, year, license_plate, car_type, transmission, fuel_type,
      seats, color, daily_rate, description, insurance_rate
    } = req.body;

    // 1) ตรวจค่าบังคับ
    if (!brand || !model || !year || !license_plate || !car_type || !transmission ||
        !fuel_type || !seats || !color || !daily_rate) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    // 2) แปลงชนิดข้อมูล + กำจัดช่องว่าง + บังคับเป็นตัวพิมพ์เล็ก
    const brandTrim = String(brand).trim();
    const modelTrim = String(model).trim();
    const licensePlateTrim = String(license_plate).trim();
    const colorTrim = String(color).trim();

    const yearInt = parseInt(year, 10);
    const seatsInt = parseInt(seats, 10);

    const carType = String(car_type).trim().toLowerCase();
    const transmissionType = String(transmission).trim().toLowerCase();
    const fuelType = String(fuel_type).trim().toLowerCase();

    const parsedDailyRate = Number(daily_rate);
    const parsedInsuranceRate = insurance_rate !== undefined && insurance_rate !== null
      ? Number(insurance_rate)
      : 0;

    // 3) ตรวจเลขให้ถูกต้อง
    if (!Number.isInteger(yearInt) || yearInt < 1990 || yearInt > (new Date().getFullYear() + 1)) {
      return res.status(400).json({ message: 'Year is invalid' });
    }
    if (!Number.isInteger(seatsInt) || seatsInt < 1 || seatsInt > 15) {
      return res.status(400).json({ message: 'Seats must be between 1 and 15' });
    }
    if (!Number.isFinite(parsedDailyRate) || parsedDailyRate < 0) {
      return res.status(400).json({ message: 'Daily rate must be a valid positive number' });
    }
    if (!Number.isFinite(parsedInsuranceRate) || parsedInsuranceRate < 0) {
      return res.status(400).json({ message: 'Insurance rate must be a valid non-negative number' });
    }

    // 4) ตรวจ ENUM ให้ตรงกับตาราง (สำคัญ: รวม 'motorbike')
    const ALLOWED_CAR_TYPES = ['sedan','suv','hatchback','pickup','van','luxury','motorbike'];
    const ALLOWED_TRANSMISSION = ['auto','manual'];
    const ALLOWED_FUEL = ['gasoline','diesel','hybrid','electric'];

    if (!ALLOWED_CAR_TYPES.includes(carType)) {
      return res.status(400).json({ message: `car_type must be one of: ${ALLOWED_CAR_TYPES.join(', ')}` });
    }
    if (!ALLOWED_TRANSMISSION.includes(transmissionType)) {
      return res.status(400).json({ message: `transmission must be one of: ${ALLOWED_TRANSMISSION.join(', ')}` });
    }
    if (!ALLOWED_FUEL.includes(fuelType)) {
      return res.status(400).json({ message: `fuel_type must be one of: ${ALLOWED_FUEL.join(', ')}` });
    }

    // 5) บันทึกลงฐานข้อมูล (มั่นใจว่าตรงกับ ENUM แล้ว)
    const result = await db.create('cars', {
      shop_id: req.user.id,
      brand: brandTrim,
      model: modelTrim,
      year: yearInt,
      license_plate: licensePlateTrim,
      car_type: carType,                
      transmission: transmissionType,
      fuel_type: fuelType,
      seats: seatsInt,
      color: colorTrim,
      daily_rate: parsedDailyRate,
      insurance_rate: parsedInsuranceRate,
      description: description ?? null,
      // อาจตั้งค่าเริ่มต้นให้ status ถ้ายังไม่ได้ตั้ง
      // status: 'available',
    });

    return res.status(201).json({
      message: 'Car added successfully',
      carId: result.insertId
    });

  } catch (err) {
    console.error('Add car error:', err);
    // ถ้า DB โยน error ENUM ออกมา ให้ยิงข้อความเข้าใจง่าย
    if (err && typeof err.message === 'string' && err.message.toLowerCase().includes('enum')) {
      return res.status(400).json({ message: 'Invalid enum value. Please check car_type, transmission, and fuel_type.' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};


// ดึงรายการรถยนต์ของร้านเช่ารถ
const getShopCars = async (req, res) => {
  try {
    const shopId = req.user.id;
    
    // ดึงข้อมูลรถยนต์ทั้งหมดของร้าน
    const cars = await db.executeQuery(
      'SELECT * FROM cars WHERE shop_id = ? AND status != "deleted" ORDER BY created_at DESC',
      [shopId]
    );
    
    // ดึงรูปภาพของรถยนต์แต่ละคัน
    for (const car of cars) {
      const images = await db.executeQuery(
        'SELECT * FROM car_images WHERE car_id = ?',
        [car.id]
      );
      car.images = images;
      
      // ถ้าไม่มี image_url แต่มีรูปภาพ ให้ใช้รูปแรกที่เป็น primary
      if (!car.image_url && images.length > 0) {
        const primaryImage = images.find(img => img.is_primary) || images[0];
        car.image_url = primaryImage.image_url;
      }
    }
    
    res.status(200).json({
      cars
    });
    
  } catch (err) {
    console.error('Get shop cars error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ดึงข้อมูลรถยนต์ตามไอดี
const getCarById = async (req, res) => {
  try {
    const carId = req.params.carId;
    
    // ตรวจสอบว่ามีคอลัมน์ promptpay_id ในตาราง users หรือไม่
    const [columns] = await db.executeQuery("SHOW COLUMNS FROM users LIKE 'promptpay_id'");
    
    let query;
    if (columns.length > 0) {
      // ดึงข้อมูลรถยนต์พร้อม promptpay_id
      query = 'SELECT c.*, u.shop_name, u.promptpay_id FROM cars c ' +
              'JOIN users u ON c.shop_id = u.id ' +
              'WHERE c.id = ? AND c.status != "deleted"';
    } else {
      // ดึงข้อมูลรถยนต์โดยไม่มี promptpay_id
      query = 'SELECT c.*, u.shop_name FROM cars c ' +
              'JOIN users u ON c.shop_id = u.id ' +
              'WHERE c.id = ? AND c.status != "deleted"';
    }
    
    const [car] = await db.executeQuery(query, [carId]);
    
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }
    
    // ดึงรูปภาพของรถยนต์
    const images = await db.executeQuery(
      'SELECT * FROM car_images WHERE car_id = ?',
      [carId]
    );
    
    car.images = images;
    
    // ถ้าไม่มี image_url แต่มีรูปภาพ ให้ใช้รูปแรกที่เป็น primary
    if (!car.image_url && images.length > 0) {
      const primaryImage = images.find(img => img.is_primary) || images[0];
      car.image_url = primaryImage.image_url;
    }
    
    res.status(200).json({
      car
    });
    
  } catch (err) {
    console.error('Get car error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateCarMainImage= async (req, res) => {
  const { carId } = req.params;
  const shopId = req.user.id;

  try {
    // เช็คสิทธิ์เจ้าของรถ
    const cars = await db.executeQuery('SELECT * FROM cars WHERE id = ? AND shop_id = ?', [carId, shopId]);
    if (cars.length === 0) {
      if (req.file?.path) { try { await fs.unlink(req.file.path); } catch {} }
      return res.status(404).json({ message: 'Car not found or you do not have access' });
    }
    const car = cars[0];

    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded (field: image)' });
    }

    const newUrl = `/uploads/${req.file.filename}`;

    // อัปเดต DB
    const result = await db.update('cars', carId, { image_url: newUrl });
    if (result.affectedRows === 0) {
      // roll back ไฟล์ใหม่กันไฟล์หลง
      try { await fs.unlink(req.file.path); } catch {}
      return res.status(500).json({ message: 'Failed to update image_url' });
    }

    // ลบไฟล์เก่าถ้ามี และไม่เท่ากับไฟล์ใหม่
    if (car.image_url && car.image_url !== newUrl) {
      // car.image_url เป็น URL (/uploads/...), แปลงเป็น path จริง (uploads/...)
      const oldAbs = path.join(process.cwd(), car.image_url.replace(/^\/uploads/, 'uploads'));
      try { await fs.unlink(oldAbs); } catch {}
    }

    return res.status(200).json({ message: 'Image updated', image_url: newUrl });
  } catch (err) {
    console.error('updateCarMainImage error:', err);
    if (req.file?.path) { try { await fs.unlink(req.file.path); } catch {} }
    return res.status(500).json({ message: 'Server error' });
  }
};

// ลบรูปหลักของรถ
const deleteCarMainImage = async (req, res) => {
  const { carId } = req.params;
  const shopId = req.user.id;

  try {
    // เช็คสิทธิ์เจ้าของรถ
    const cars = await db.executeQuery('SELECT * FROM cars WHERE id = ? AND shop_id = ?', [carId, shopId]);
    if (cars.length === 0) {
      return res.status(404).json({ message: 'Car not found or you do not have access' });
    }
    const car = cars[0];

    if (!car.image_url) {
      return res.status(400).json({ message: 'No image set for this car' });
    }

    // ลบไฟล์จริงก่อน
    const abs = path.join(process.cwd(), car.image_url.replace(/^\/uploads/, 'uploads'));
    try { await fs.unlink(abs); } catch {}

    // เคลียร์ค่าใน DB
    const result = await db.update('cars', carId, { image_url: null });
    if (result.affectedRows === 0) {
      return res.status(500).json({ message: 'Failed to clear image_url' });
    }

    return res.status(200).json({ message: 'Image deleted' });
  } catch (err) {
    console.error('deleteCarMainImage error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};


// อัปเดตข้อมูลรถยนต์
const updateCar = async (req, res) => {
  try {
    const carId = req.params.carId;
    const shopId = req.user.id;
    
    // ตรวจสอบว่าเป็นเจ้าของรถยนต์หรือไม่
    const cars = await db.executeQuery(
      'SELECT * FROM cars WHERE id = ? AND shop_id = ?',
      [carId, shopId]
    );
    
    if (cars.length === 0) {
      return res.status(404).json({ message: 'Car not found or you do not have access' });
    }
    
    const { 
      brand, model, year, license_plate, car_type, transmission, fuel_type,
      seats, color, daily_rate, description, status, insurance_rate
    } = req.body;
    
    // เตรียมข้อมูลที่อนุญาตให้อัปเดต
    const updateData = {};
    if (brand) updateData.brand = brand;
    if (model) updateData.model = model;
    if (year) updateData.year = year;
    if (license_plate) updateData.license_plate = license_plate;
    if (car_type) updateData.car_type = car_type;
    if (transmission) updateData.transmission = transmission;
    if (fuel_type) updateData.fuel_type = fuel_type;
    if (seats) updateData.seats = seats;
    if (color) updateData.color = color;
    
    // ตรวจสอบค่า daily_rate และ insurance_rate
    if (daily_rate !== undefined) {
      const parsedDailyRate = parseFloat(daily_rate);
      if (isNaN(parsedDailyRate) || parsedDailyRate < 0) {
        return res.status(400).json({ message: 'Daily rate must be a valid positive number' });
      }
      updateData.daily_rate = parsedDailyRate;
    }
    
    if (insurance_rate !== undefined) {
      const parsedInsuranceRate = parseFloat(insurance_rate);
      if (isNaN(parsedInsuranceRate) || parsedInsuranceRate < 0) {
        return res.status(400).json({ message: 'Insurance rate must be a valid non-negative number' });
      }
      updateData.insurance_rate = parsedInsuranceRate;
    }
    
    if (description !== undefined) updateData.description = description;
    if (status) updateData.status = status;
    
    // ตรวจสอบว่ามีข้อมูลที่จะอัปเดตหรือไม่
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No data to update' });
    }
    
    // อัปเดตข้อมูลรถยนต์
    const result = await db.update('cars', carId, updateData);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Car not found' });
    }
    
    res.status(200).json({
      message: 'Car updated successfully'
    });
    
  } catch (err) {
    console.error('Update car error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// อัปเดตสถานะรถยนต์
const updateCarStatus = async (req, res) => {
  try {
    const carId = req.params.carId;
    const shopId = req.user.id;
    const { status } = req.body;
    
    // ตรวจสอบว่าส่งสถานะมาหรือไม่
    if (!status) {
      return res.status(400).json({ message: 'กรุณาระบุสถานะ' });
    }
    
    // ตรวจสอบว่าสถานะถูกต้องหรือไม่
    if (!['available', 'rented', 'maintenance', 'hidden','close'].includes(status)) {
      return res.status(400).json({ 
        message: 'สถานะไม่ถูกต้อง สถานะต้องเป็น available, rented, maintenance หรือ hidden'
      });
    }
    
    // ตรวจสอบว่าเป็นเจ้าของรถยนต์หรือไม่
    const [car] = await db.executeQuery(
      'SELECT * FROM cars WHERE id = ? AND shop_id = ?',
      [carId, shopId]
    );
    
    if (!car) {
      return res.status(404).json({ message: 'ไม่พบรถยนต์หรือคุณไม่มีสิทธิ์เข้าถึง' });
    }
    
    // ตรวจสอบว่ารถกำลังถูกเช่าอยู่หรือไม่ ถ้ากำลังเช่าอยู่ไม่ควรเปลี่ยนเป็น available หรือ hidden
    if ((status === 'available' || status === 'hidden') && car.status === 'rented') {
      // ตรวจสอบว่ามีการเช่าที่กำลังดำเนินอยู่หรือไม่
      const [activeRental] = await db.executeQuery(
        `SELECT COUNT(*) as count FROM rentals 
         WHERE car_id = ? AND rental_status IN ('confirmed', 'ongoing')`,
        [carId]
      );
      
      if (activeRental && activeRental.count > 0) {
        return res.status(400).json({ 
          message: 'ไม่สามารถเปลี่ยนสถานะได้เนื่องจากรถยนต์นี้กำลังถูกเช่าอยู่'
        });
      }
    }
    
    // อัปเดตสถานะรถยนต์
    const result = await db.update('cars', carId, { status });
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'ไม่พบรถยนต์' });
    }
    
    // ส่งข้อความตอบกลับพร้อมคำแนะนำเพิ่มเติม
    let message = `อัปเดตสถานะรถยนต์เป็น "${status}" สำเร็จ`;
    let additionalInfo = null;
    
    if (status === 'hidden') {
      additionalInfo = 'รถยนต์นี้จะไม่ปรากฏในหน้าค้นหาสำหรับลูกค้า แต่ยังคงมีอยู่ในระบบพร้อมประวัติการเช่า';
    } else if (status === 'maintenance') {
      additionalInfo = 'รถยนต์นี้จะไม่สามารถจองได้จนกว่าจะเปลี่ยนสถานะกลับเป็น available';
    }
    
    res.status(200).json({
      message,
      additionalInfo
    });
    
  } catch (err) {
    console.error('Update car status error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตสถานะรถยนต์' });
  }
};

// ลบรถยนต์
const deleteCar = async (req, res) => {
  try {
    const carId = req.params.carId;
    const shopId = req.user.id;
    
    // ตรวจสอบว่าเป็นเจ้าของรถยนต์หรือไม่
    const [car] = await db.executeQuery(
      'SELECT * FROM cars WHERE id = ? AND shop_id = ?',
      [carId, shopId]
    );
    
    if (!car) {
      return res.status(404).json({ message: 'รถไม่พบในระบบหรือคุณไม่ได้เป็นเจ้าของรถยนต์นี้' });
    }
    
    // ก่อนลบ ให้ตรวจสอบว่ามีการเช่าที่กำลังดำเนินการอยู่หรือไม่
    console.log(`Checking active rentals for car ${carId}`);
    const [activeRentals] = await db.executeQuery(
      'SELECT COUNT(*) as count FROM rentals WHERE car_id = ? AND rental_status IN (?, ?)',
      [carId, 'confirmed', 'ongoing']
    );
    console.log(`Active rentals count: ${activeRentals?.count || 0}`);
    
    // ตรวจสอบ rentals ทั้งหมดของรถคันนี้
    const allRentals = await db.executeQuery(
      'SELECT id, rental_status FROM rentals WHERE car_id = ?',
      [carId]
    );
    console.log(`All rentals for car ${carId}:`, allRentals);
    
    if (activeRentals?.count > 0) {
      // มีการเช่าที่กำลังดำเนินการอยู่ ไม่สามารถลบได้
      console.log(`Cannot delete car ${carId} - has active rentals`);
      return res.status(409).json({ 
        message: 'ไม่สามารถลบรถยนต์นี้ได้ เนื่องจากมีการเช่าที่เกี่ยวข้อง',
        suggestion: 'กรุณารอให้การเช่าสิ้นสุดก่อนหรือเปลี่ยนสถานะรถเป็น "ซ่อมบำรุง" แทน'
      });
    }
    
    // ใช้ soft delete แทนการลบจริง - เปลี่ยนสถานะเป็น 'deleted'
    console.log(`Proceeding to soft delete car ${carId}`);
    const result = await db.executeQuery(
      'UPDATE cars SET status = ?, updated_at = NOW() WHERE id = ?',
      ['deleted', carId]
    );
    console.log(`Update result:`, result);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'ไม่พบรถยนต์' });
    }
    
    res.status(200).json({
      message: 'ลบรถยนต์สำเร็จ (ซ่อนจากการแสดงผล)'
    });
    
  } catch (err) {
    console.error('Delete car error:', err);
    
    // ตรวจสอบว่าเป็น Foreign Key Constraint Error หรือไม่
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({ 
        message: 'ไม่สามารถลบรถยนต์นี้ได้เนื่องจากมีข้อมูลการเช่าที่เกี่ยวข้อง กรุณาเปลี่ยนสถานะรถแทนการลบ',
        error_code: 'FOREIGN_KEY_CONSTRAINT'
      });
    }
    
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบรถยนต์' });
  }
};
// ค้นหารถยนต์
const searchCars = async (req, res) => {
  try {
    const conditions = ['c.status != "hidden"', 'c.status != "deleted"'];
    const values = [];

    // ---- อ่านและตรวจพารามิเตอร์ราคาแบบ "มีอยู่จริง"
    const hasMin = Object.prototype.hasOwnProperty.call(req.query, 'min_price');
    const hasMax = Object.prototype.hasOwnProperty.call(req.query, 'max_price');
    const minStr = hasMin ? String(req.query.min_price) : '';
    const maxStr = hasMax ? String(req.query.max_price) : '';

    const minNum = hasMin && minStr !== '' ? Number(minStr) : undefined;
    const maxNum = hasMax && maxStr !== '' ? Number(maxStr) : undefined;

    if (minStr !== '' && (Number.isNaN(minNum) || minNum < 0)) {
      return res.status(400).json({ message: 'min_price must be a non-negative number' });
    }
    if (maxStr !== '' && (Number.isNaN(maxNum) || maxNum < 0)) {
      return res.status(400).json({ message: 'max_price must be a non-negative number' });
    }

    // ✅ กติกาพิเศษ: ถ้า min_price === 0 → ไม่แสดงรถเลย
    if (minNum === 0) {
      return res.status(200).json({ cars: [] });
    }

    // ---- base select
    let query = `
      SELECT c.*, u.shop_name, u.promptpay_id
      FROM cars c
      JOIN users u ON c.shop_id = u.id
      WHERE ${conditions.join(' AND ')}
    `;

    // ---- กรองทั่วไป
    if (req.query.brand)         { query += ' AND c.brand LIKE ?';        values.push(`%${req.query.brand}%`); }
    if (req.query.model)         { query += ' AND c.model LIKE ?';        values.push(`%${req.query.model}%`); }
    if (req.query.car_type)      { query += ' AND c.car_type = ?';        values.push(req.query.car_type); }
    if (minNum !== undefined)    { query += ' AND c.daily_rate >= ?';     values.push(minNum); }
    if (maxNum !== undefined)    { query += ' AND c.daily_rate <= ?';     values.push(maxNum); }

    if (Object.prototype.hasOwnProperty.call(req.query, 'seats') && req.query.seats !== '') {
      query += ' AND c.seats >= ?';
      values.push(Number(req.query.seats));
    }
    if (req.query.transmission)  { query += ' AND c.transmission = ?';    values.push(req.query.transmission); }
    if (req.query.fuel_type)     { query += ' AND c.fuel_type = ?';       values.push(req.query.fuel_type); }

    // ✅ กรอง blacklist เมื่อลูกค้าเป็นผู้เรียก
    const { clause, params } = blacklistFilterForCustomer(req);
    query += clause;
    values.push(...params);

    query += ' ORDER BY c.created_at DESC';
    if (req.query.limit) { query += ' LIMIT ?'; values.push(Number(req.query.limit)); }

    const cars = await db.executeQuery(query, values);

    // เติมรูปภาพหลักหากยังไม่มี
    for (const car of cars) {
      const images = await db.executeQuery('SELECT * FROM car_images WHERE car_id = ?', [car.id]);
      car.images = images;
      if (!car.image_url && images.length > 0) {
        const primaryImage = images.find(img => img.is_primary) || images[0];
        car.image_url = primaryImage.image_url;
      }
    }

    return res.status(200).json({ cars });
  } catch (err) {
    console.error('Search cars error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};


// ดึงข้อมูลรถยนต์สำหรับลูกค้า
const getCarForCustomer = async (req, res) => {
  try {
    const carId = Number(req.params.carId);
    if (!carId) {
      return res.status(400).json({ message: 'Invalid car id' });
    }

    // สร้างเงื่อนไขกัน blacklist ถ้าเป็นลูกค้า
    const isCustomer = req.user?.role === 'customer';
    const customerId = isCustomer ? Number(req.user.id) : null;

    // พารามิเตอร์ของ query
    const params = [carId];
    let extraWhere = '';

    if (isCustomer && customerId) {
      // ลูกค้าที่ถูกแบนจะไม่เห็นรถของร้านนั้น (และจะได้ 404 เพื่อไม่เปิดเผยการมีอยู่)
      extraWhere = `
        AND NOT EXISTS (
          SELECT 1 FROM blacklists b
          WHERE b.shop_id = c.shop_id
            AND b.customer_id = ?
        )
      `;
      params.push(customerId);
    }

    // ดึงข้อมูลรถ + ข้อมูลร้าน (รวม promptpay_id)
    const rows = await db.executeQuery(
      `
      SELECT 
        c.*, 
        u.shop_name, 
        u.address AS shop_address, 
        u.phone AS shop_phone, 
        u.promptpay_id
      FROM cars c
      JOIN users u ON c.shop_id = u.id AND u.role = 'shop'
      WHERE c.id = ?
        AND c.status != 'hidden'
        ${extraWhere}
      LIMIT 1
      `,
      params
    );

    const car = rows[0];
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    // ดึงรูปภาพทั้งหมดของรถ
    const images = await db.executeQuery(
      'SELECT id, car_id, image_url, is_primary, created_at FROM car_images WHERE car_id = ? ORDER BY id ASC',
      [carId]
    );

    // ใส่ images ลงใน payload
    car.images = images;

    // ถ้าไม่มี image_url แต่มีรูปภาพ → ใช้รูป primary ก่อน ไม่มีก็ใช้รูปแรก
    if (!car.image_url && images.length > 0) {
      const primaryImage = images.find((img) => !!img.is_primary) || images[0];
      car.image_url = primaryImage.image_url;
    }

    return res.status(200).json({ car });
  } catch (err) {
    console.error('Get car details error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};


const getShopCarsByShopId = async (req, res) => {
  try {
    const shopId = Number(req.params.shopId);
    if (!shopId) return res.status(400).json({ message: 'Invalid shop id' });

    // ตรวจว่าร้านมีจริงและ active
    const [shop] = await db.executeQuery(
      'SELECT id, promptpay_id FROM users WHERE id = ? AND role = "shop" AND status = "active" LIMIT 1',
      [shopId]
    );
    if (!shop) return res.status(404).json({ message: 'Shop not found' });

    // ✅ ถ้า caller เป็น customer และถูกแบนโดยร้านนี้ → ตอบ 404 (ไม่บอกใบ้การมีอยู่)
    if (req.user?.role === 'customer' && req.user?.id) {
      const blocked = await db.executeQuery(
        'SELECT 1 FROM blacklists WHERE shop_id = ? AND customer_id = ? LIMIT 1',
        [shopId, Number(req.user.id)]
      );
      if (blocked.length) return res.status(404).json({ message: 'Shop not found' });
    }

    // ดึงรถที่ available ของร้าน
    const cars = await db.executeQuery(
      'SELECT * FROM cars WHERE shop_id = ? AND status = "available" ORDER BY created_at DESC',
      [shopId]
    );

    for (const car of cars) {
      const images = await db.executeQuery('SELECT * FROM car_images WHERE car_id = ?', [car.id]);
      car.images = images;
      if (!car.image_url && images.length > 0) {
        const primaryImage = images.find(img => img.is_primary) || images[0];
        car.image_url = primaryImage.image_url;
      }
      car.promptpay_id = shop.promptpay_id || null;
    }

    res.status(200).json({ cars, shop_promptpay_id: shop.promptpay_id || null });

  } catch (err) {
    console.error('Get shop cars error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


// ดึงรถยนต์แนะนำ (featured cars)
const getFeaturedCars = async (req, res) => {
  try {
    // ตรวจสอบว่ามีคอลัมน์ promptpay_id ในตาราง users หรือไม่
    const [columns] = await db.executeQuery("SHOW COLUMNS FROM users LIKE 'promptpay_id'");
    
    let query;
    if (columns.length > 0) {
      // ดึงข้อมูลรถยนต์แนะนำพร้อม promptpay_id
      query = `SELECT c.*, u.shop_name, u.promptpay_id
              FROM cars c 
              JOIN users u ON c.shop_id = u.id 
              WHERE c.status = 'available' AND c.status != 'hidden'
              ORDER BY c.created_at DESC, c.daily_rate ASC
              LIMIT 6`;
    } else {
      // ดึงข้อมูลรถยนต์แนะนำโดยไม่มี promptpay_id
      query = `SELECT c.*, u.shop_name
              FROM cars c 
              JOIN users u ON c.shop_id = u.id 
              WHERE c.status = 'available' AND c.status != 'hidden'
              ORDER BY c.created_at DESC, c.daily_rate ASC
              LIMIT 6`;
    }
    
    const cars = await db.executeQuery(query);
    
    // ดึงรูปภาพของรถยนต์แต่ละคัน
    for (const car of cars) {
      const images = await db.executeQuery(
        'SELECT * FROM car_images WHERE car_id = ?',
        [car.id]
      );
      car.images = images;
      
      // ถ้าไม่มี image_url แต่มีรูปภาพ ให้ใช้รูปแรกที่เป็น primary
      if (!car.image_url && images.length > 0) {
        const primaryImage = images.find(img => img.is_primary) || images[0];
        car.image_url = primaryImage.image_url;
      }
    }
    
    res.status(200).json({
      cars
    });
    
  } catch (err) {
    console.error('Get featured cars error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


// ดึงประวัติการเช่ารถของ "ร้านเรา" ทั้งหมด พร้อมตัวกรองและแบ่งหน้า
const getShopRentalHistory = async (req, res) => {
  try {
    const shopId = req.user.id; // ต้องเป็น role = shop

    // ตัวกรอง (query string)
    const {
      rental_status,            // pending|confirmed|ongoing|completed|cancelled
      payment_status,           // pending|pending_verification|paid|rejected|refunded|failed
      start_date,               // YYYY-MM-DD
      end_date,                 // YYYY-MM-DD
      car_id,                   // เลือกเฉพาะคัน
      q,                        // ค้นหาชื่อลูกค้า/อีเมล/ป้ายทะเบียน
      page = 1,                 // แบ่งหน้า
      page_size = 20,           // ต่อหน้า
      order = 'desc'            // asc|desc by created_at
    } = req.query;

    const limit = Math.min(Number(page_size) || 20, 100);
    const offset = (Math.max(Number(page) || 1, 1) - 1) * limit;

    // เงื่อนไขฐาน
    const where = [`r.shop_id = ?`];
    const params = [shopId];

    // ตัวกรองเสริม
    if (rental_status) {
      where.push(`r.rental_status = ?`);
      params.push(rental_status);
    }
    if (payment_status) {
      where.push(`r.payment_status = ?`);
      params.push(payment_status);
    }
    if (start_date) {
      where.push(`r.start_date >= ?`);
      params.push(start_date);
    }
    if (end_date) {
      where.push(`r.end_date <= ?`);
      params.push(end_date);
    }
    if (car_id) {
      where.push(`r.car_id = ?`);
      params.push(Number(car_id));
    }
    if (q) {
      // ค้นหาจาก ลูกค้า/อีเมล/ป้ายทะเบียน
      where.push(`(cust.username LIKE ? OR cust.email LIKE ? OR c.license_plate LIKE ?)`);
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    // สำหรับสถานะจ่ายเงินล่าสุดของแต่ละ rental (หากอยากได้ “บันทึกจ่ายล่าสุด”)
    // เราเลือก payment ที่ created_at ล่าสุดของแต่ละ rental_id
    const sql = `
      SELECT
        r.id,
        r.car_id,
        r.customer_id,
        r.shop_id,
        r.start_date,
        r.end_date,
        r.pickup_location,
        r.return_location,
        r.rental_status,
        r.payment_status,
        r.total_amount,
        r.deposit_amount,
        r.insurance_rate,
        r.created_at,
        r.updated_at,

        -- ข้อมูลรถ
        c.brand, c.model, c.year, c.license_plate, c.car_type, c.transmission, c.fuel_type, c.seats, c.color, c.image_url,

        -- ลูกค้า
        cust.username AS customer_username,
        cust.email    AS customer_email,
        cust.phone    AS customer_phone,

        -- ร้าน (คุณคือเจ้าของร้านนี้)
        shop.shop_name AS shop_name,

        -- ยอดชำระล่าสุด (ถ้ามี)
        p_latest.id         AS latest_payment_id,
        p_latest.amount     AS latest_payment_amount,
        p_latest.payment_method AS latest_payment_method,
        p_latest.payment_status AS latest_payment_status,
        p_latest.payment_date   AS latest_payment_date,
        p_latest.proof_image    AS latest_payment_proof

      FROM rentals r
      JOIN cars c      ON r.car_id = c.id
      JOIN users shop  ON r.shop_id = shop.id
      JOIN users cust  ON r.customer_id = cust.id

      -- join payment ล่าสุด ด้วยวิธีซับคิวรีเลือก created_at มากสุด
      LEFT JOIN payments p_latest
        ON p_latest.id = (
          SELECT p2.id
          FROM payments p2
          WHERE p2.rental_id = r.id
          ORDER BY p2.created_at DESC, p2.id DESC
          LIMIT 1
        )

      ${whereSql}
      ORDER BY r.created_at ${order?.toLowerCase() === 'asc' ? 'ASC' : 'DESC'}
      LIMIT ? OFFSET ?;
    `;

    const countSql = `
      SELECT COUNT(*) AS total
      FROM rentals r
      JOIN cars c     ON r.car_id = c.id
      JOIN users cust ON r.customer_id = cust.id
      ${whereSql};
    `;

    const rows = await db.executeQuery(sql, [...params, limit, offset]);
    const [countRow] = await db.executeQuery(countSql, params);
    const total = countRow?.total || 0;

    return res.status(200).json({
      total,
      page: Number(page),
      page_size: limit,
      items: rows
    });

  } catch (err) {
    console.error('Get shop rental history error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};



const getPopularCars = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 12;

    // scope: ?shop_id=... หรือถ้าเป็นร้านล็อกอิน default = ร้านนั้น
    const shopId = req.query.shop_id
      ? Number(req.query.shop_id)
      : (req.user?.role === 'shop' ? Number(req.user.id) : null);

    // 1) คิวรีหลัก: ยอดเช่า + สถิติรีวิว
    const sqlMain = `
      SELECT
        c.id, c.shop_id, c.brand, c.model, c.year, c.license_plate,
        c.car_type, c.transmission, c.fuel_type, c.seats, c.color,
        c.daily_rate, c.insurance_rate, c.status, c.description,
        c.image_url, c.created_at, c.updated_at,
        COALESCE(rc.rentals_count, 0) AS rentals_count,
        COALESCE(rv.reviews_count, 0) AS reviews_count,
        ROUND(COALESCE(rv.avg_rating, 0), 2) AS avg_rating
      FROM cars c
      LEFT JOIN (
        SELECT car_id, COUNT(*) AS rentals_count
        FROM rentals
        -- ✅ นับทุก rental ที่ไม่ถูกยกเลิก
        WHERE rental_status NOT IN ('cancelled')
        GROUP BY car_id
      ) rc ON rc.car_id = c.id
      LEFT JOIN (
        SELECT car_id, COUNT(*) AS reviews_count, AVG(rating) AS avg_rating
        FROM reviews
        GROUP BY car_id
      ) rv ON rv.car_id = c.id
      WHERE c.status != 'hidden'
      ${shopId ? 'AND c.shop_id = ?' : ''}
      ORDER BY rentals_count DESC, c.created_at DESC
      LIMIT ?`;
    const params = shopId ? [shopId, limit] : [limit];
    const rows = await db.executeQuery(sqlMain, params);

    // 2) ดึง “รีวิวล่าสุด 2 อันต่อคัน”
    let latestMap = new Map();
    if (rows.length) {
      const carIds = rows.map(r => r.id);
      const placeholders = carIds.map(() => '?').join(',');
      const sqlLatest = `
        SELECT r.id, r.car_id, r.rating, r.comment, r.created_at,
               u.username AS customer_name
        FROM reviews r
        JOIN users u ON u.id = r.customer_id
        WHERE r.car_id IN (${placeholders})
        ORDER BY r.car_id ASC, r.created_at DESC`;
      const latestRows = await db.executeQuery(sqlLatest, carIds);

      for (const r of latestRows) {
        const arr = latestMap.get(r.car_id) || [];
        if (arr.length < 2) arr.push(r);  // เอาแค่ 2 อันล่าสุด
        latestMap.set(r.car_id, arr);
      }
    }

    // รวมผล
    const result = rows.map(r => ({
      ...r,
      latest_reviews: latestMap.get(r.id) || [],
    }));

    res.json({ scope: shopId ? 'shop' : 'global', cars: result });
  } catch (err) {
    console.error('getPopularCars error:', err);
    res.status(500).json({ message: 'Failed to fetch popular cars' });
  }
};

const getShopDashboardStats = async (req, res) => {
  try {
    // Ensure the user is a shop owner
    if (req.user?.role !== 'shop') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const shopId = Number(req.user.id);

    // 1. Total Revenue (from completed rentals with paid status)
    const totalRevenueSql = `
      SELECT SUM(p.amount) AS totalRevenue
      FROM payments p
      JOIN rentals r ON p.rental_id = r.id
      WHERE r.shop_id = ? AND p.payment_status = 'paid' AND r.rental_status = 'completed'
    `;
    const [totalRevenueResult] = await db.executeQuery(totalRevenueSql, [shopId]);
    const totalRevenue = totalRevenueResult?.totalRevenue || 0;

    // 2. Daily Revenue (for today)
    const dailyRevenueSql = `
      SELECT SUM(p.amount) AS dailyRevenue
      FROM payments p
      JOIN rentals r ON p.rental_id = r.id
      WHERE r.shop_id = ? AND p.payment_status = 'paid' AND DATE(p.payment_date) = CURDATE()
    `;
    const [dailyRevenueResult] = await db.executeQuery(dailyRevenueSql, [shopId]);
    const dailyRevenue = dailyRevenueResult?.dailyRevenue || 0;

    // 3. Monthly Revenue (for a line chart, last 12 months)
    const monthlyRevenueSql = `
      SELECT
        DATE_FORMAT(p.payment_date, '%Y-%m') AS month,
        SUM(p.amount) AS monthlyRevenue
      FROM payments p
      JOIN rentals r ON p.rental_id = r.id
      WHERE r.shop_id = ? AND p.payment_status = 'paid' AND p.payment_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY month
      ORDER BY month ASC
    `;
    const monthlyRevenue = await db.executeQuery(monthlyRevenueSql, [shopId]);

    // 4. Yearly Revenue (for current year)
    const yearlyRevenueSql = `
      SELECT SUM(p.amount) AS yearlyRevenue
      FROM payments p
      JOIN rentals r ON p.rental_id = r.id
      WHERE r.shop_id = ? AND p.payment_status = 'paid' AND YEAR(p.payment_date) = YEAR(CURDATE())
    `;
    const [yearlyRevenueResult] = await db.executeQuery(yearlyRevenueSql, [shopId]);
    const yearlyRevenue = yearlyRevenueResult?.yearlyRevenue || 0;

    // 5. Total Rentals
    const totalRentalsSql = `
      SELECT COUNT(*) AS totalRentals
      FROM rentals
      WHERE shop_id = ? AND rental_status NOT IN ('cancelled')
    `;
    const [rentalsResult] = await db.executeQuery(totalRentalsSql, [shopId]);
    const totalRentals = rentalsResult?.totalRentals || 0;

    res.json({
      totalRevenue,
      dailyRevenue,
      monthlyRevenue,
      yearlyRevenue,
      totalRentals,
    });

  } catch (err) {
    console.error('getShopDashboardStats error:', err);
    res.status(500).json({ message: 'Failed to fetch dashboard statistics' });
  }
};


// แก้ไข module.exports เพื่อเพิ่มฟังก์ชันใหม่
module.exports = {
  addCar,
  getShopCars,
  getShopCarsByShopId,
  getCarById,
  updateCar,
  updateCarStatus,
  deleteCar,
  searchCars,
  getCarForCustomer,
  getFeaturedCars,
  getShopRentalHistory,
  getPopularCars,
  updateCarMainImage,
  deleteCarMainImage,
  getShopDashboardStats,
};