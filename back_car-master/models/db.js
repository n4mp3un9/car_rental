// server/models/db.js
const { pool } = require('../config');

// ฟังก์ชันสำหรับสร้างตารางที่จำเป็น
const initializeDatabase = async () => {
  try {
    const connection = await pool.getConnection();
    
    // สร้างตาราง users
    await connection.query(`
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('customer', 'shop') NOT NULL DEFAULT 'customer',
    phone VARCHAR(20) NULL,
    address TEXT NULL,
    profile_image VARCHAR(255) NULL,
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    shop_name VARCHAR(255) NULL,
    shop_description TEXT NULL,
    promptpay_id VARCHAR(64) NULL,
    policy TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB
`);

    
    // สร้างตาราง cars
    await connection.query(`
      CREATE TABLE IF NOT EXISTS cars (
        id INT AUTO_INCREMENT PRIMARY KEY,
        shop_id INT NOT NULL,
        brand VARCHAR(100) NOT NULL,
        model VARCHAR(100) NOT NULL,
        year INT NOT NULL,
        license_plate VARCHAR(20) NOT NULL,
        car_type ENUM('sedan', 'suv', 'hatchback', 'pickup', 'van', 'luxury','motorbike') NOT NULL,
        transmission ENUM('auto', 'manual') NOT NULL,
        fuel_type ENUM('gasoline', 'diesel', 'hybrid', 'electric') NOT NULL,
        seats INT NOT NULL,
        color VARCHAR(50) NOT NULL,
        daily_rate DECIMAL(10, 2) NOT NULL,
        insurance_rate DECIMAL(10, 2) DEFAULT 0.00,
        status ENUM('available', 'rented', 'maintenance', 'hidden') NOT NULL DEFAULT 'available',
        description TEXT NULL,
        image_url VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (shop_id) REFERENCES users(id)
      ) ENGINE=InnoDB
    `);
    
    // สร้างตาราง car_images
    await connection.query(`
      CREATE TABLE IF NOT EXISTS car_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        car_id INT NOT NULL,
        image_url VARCHAR(255) NOT NULL,
        is_primary BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);
    
    // สร้างตาราง rentals
    await connection.query(`
      CREATE TABLE IF NOT EXISTS rentals (
      id INT AUTO_INCREMENT PRIMARY KEY,
      car_id INT NOT NULL,
      customer_id INT NOT NULL,
      shop_id INT NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,

      pickup_location VARCHAR(255) NULL,
      return_location VARCHAR(255) NULL,

      rental_status ENUM('pending', 'confirmed', 'ongoing', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
      payment_status ENUM('pending', 'pending_verification', 'paid', 'rejected', 'refunded', 'failed') NOT NULL DEFAULT 'pending',

      total_amount DECIMAL(10, 2) NOT NULL,
      deposit_amount DECIMAL(10, 2) NULL,
      insurance_rate DECIMAL(10, 2) DEFAULT 0.00,

      -- ✅ ใช้ TIMESTAMP ได้เหมือนเดิม
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

      -- ✅ ธง “ร้านรับทราบแล้ว” (ให้เป็น NULL จนกว่าจะรับทราบ)
      shop_acknowledged_at DATETIME NULL,

      FOREIGN KEY (car_id) REFERENCES cars(id),
      FOREIGN KEY (customer_id) REFERENCES users(id),
      FOREIGN KEY (shop_id) REFERENCES users(id)
    ) ENGINE=InnoDB
    `);
    try {
      await connection.query(`
        ALTER TABLE rentals
          ADD COLUMN shop_acknowledged_at DATETIME NULL AFTER end_date
      `);
    } catch (e) {
      // MySQL 1060 = Duplicate column name → แปลว่ามีแล้ว ข้ามได้
      if (e?.code !== 'ER_DUP_FIELDNAME' && e?.errno !== 1060) throw e;
    }

    // สร้างดัชนีช่วยค้นหา: (shop_id, rental_status, shop_acknowledged_at)
    // MySQL ยังไม่มี CREATE INDEX IF NOT EXISTS อย่างเป็นทางการในหลายเวอร์ชัน
    // เลยเช็คก่อนผ่าน information_schema
    const [idxRows] = await connection.query(`
      SELECT 1 FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name   = 'rentals'
        AND index_name   = 'idx_rentals_shop_status_ack'
      LIMIT 1
    `);
    if (!idxRows.length) {
      await connection.query(`
        CREATE INDEX idx_rentals_shop_status_ack
          ON rentals (shop_id, rental_status, shop_acknowledged_at)
      `);
    }
    
    // สร้างตาราง payments
    await connection.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        rental_id INT NOT NULL,
        payment_method ENUM('credit_card', 'bank_transfer', 'cash', 'qr_code', 'promptpay') NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        payment_date DATETIME NULL,
        payment_status ENUM('pending', 'pending_verification', 'paid', 'rejected', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
        transaction_id VARCHAR(100) NULL,
        proof_image VARCHAR(255) NULL,
        verified_at DATETIME NULL,
        verified_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (rental_id) REFERENCES rentals(id),
        FOREIGN KEY (verified_by) REFERENCES users(id)
      ) ENGINE=InnoDB
    `);
    
    // สร้างตาราง reviews
    await connection.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        rental_id INT NOT NULL,
        customer_id INT NOT NULL,
        shop_id INT NOT NULL,
        car_id INT NOT NULL,
        rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
        comment TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (rental_id) REFERENCES rentals(id),
        FOREIGN KEY (customer_id) REFERENCES users(id),
        FOREIGN KEY (shop_id) REFERENCES users(id),
        FOREIGN KEY (car_id) REFERENCES cars(id)
      ) ENGINE=InnoDB
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS blacklists (
        id INT AUTO_INCREMENT PRIMARY KEY,
        shop_id INT NOT NULL,
        customer_id INT NOT NULL,
        reason TEXT NULL,  -- เหตุผล optional สำหรับบันทึก
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_blacklist (shop_id, customer_id),  -- ป้องกันเพิ่มซ้ำ
        FOREIGN KEY (shop_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);
    
    // อัปเดต schema เดิม (ถ้ามี) ให้สอดคล้องกับโค้ดปัจจุบัน
    // หมายเหตุ: ใช้ IF NOT EXISTS เพื่อหลีกเลี่ยง error เมื่อมีคอลัมน์อยู่แล้ว (MySQL 8+)
    await connection.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS promptpay_id VARCHAR(64) NULL");
    await connection.query("ALTER TABLE cars MODIFY COLUMN status ENUM('available','rented','maintenance','hidden') NOT NULL DEFAULT 'available'");
    await connection.query("ALTER TABLE rentals MODIFY COLUMN payment_status ENUM('pending','pending_verification','paid','rejected','refunded','failed') NOT NULL DEFAULT 'pending'");
    await connection.query("ALTER TABLE payments MODIFY COLUMN payment_method ENUM('credit_card','bank_transfer','cash','qr_code','promptpay') NOT NULL");
    await connection.query("ALTER TABLE payments MODIFY COLUMN payment_status ENUM('pending','pending_verification','paid','rejected','failed','refunded') NOT NULL DEFAULT 'pending'");
    await connection.query("ALTER TABLE payments ADD COLUMN IF NOT EXISTS proof_image VARCHAR(255) NULL");
    await connection.query("ALTER TABLE payments ADD COLUMN IF NOT EXISTS verified_at DATETIME NULL");
    await connection.query("ALTER TABLE payments ADD COLUMN IF NOT EXISTS verified_by INT NULL");
    await connection.query("ALTER TABLE payments DROP COLUMN IF EXISTS payment_proof");

    console.log('Database initialized successfully');
    connection.release();
    return true;
  } catch (err) {
    console.error('Error initializing database:', err);
    return false;
  }
};

// ฟังก์ชันพื้นฐานสำหรับทำงานกับฐานข้อมูล
const executeQuery = async (sql, params = []) => {
  try {
    const [result] = await pool.query(sql, params);
    return result;
  } catch (err) {
    console.error('Database query error:', err);
    throw err;
  }
};

const findById = async (table, id) => {
  return await executeQuery(`SELECT * FROM ${table} WHERE id = ?`, [id]);
};

const findOne = async (table, condition, params) => {
  const whereClause = Object.keys(condition)
    .map(key => `${key} = ?`)
    .join(' AND ');
  
  const result = await executeQuery(
    `SELECT * FROM ${table} WHERE ${whereClause} LIMIT 1`, 
    params
  );
  
  return result.length > 0 ? result[0] : null;
};

const findAll = async (table, condition = {}, params = []) => {
  let query = `SELECT * FROM ${table}`;
  
  if (Object.keys(condition).length > 0) {
    const whereClause = Object.keys(condition)
      .map(key => `${key} = ?`)
      .join(' AND ');
    
    query += ` WHERE ${whereClause}`;
  }
  
  return await executeQuery(query, params);
};

const create = async (table, data) => {
  const columns = Object.keys(data).join(', ');
  const placeholders = Array(Object.keys(data).length).fill('?').join(', ');
  const values = Object.values(data);
  
  const result = await executeQuery(
    `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`,
    values
  );
  
  return result;
};

const update = async (table, id, data) => {
  const setClause = Object.keys(data)
    .map(key => `${key} = ?`)
    .join(', ');
  
  const values = [...Object.values(data), id];
  
  const result = await executeQuery(
    `UPDATE ${table} SET ${setClause} WHERE id = ?`,
    values
  );
  
  return result;
};

const remove = async (table, id) => {
  const result = await executeQuery(
    `DELETE FROM ${table} WHERE id = ?`,
    [id]
  );
  
  return result;
};

//สำหรับ backlist
const addToBlacklist = async (shopId, customerId, reason = null) => {
  return await create('blacklists', { shop_id: shopId, customer_id: customerId, reason });
};

const removeFromBlacklist = async (shopId, customerId) => {
  return await executeQuery(
    'DELETE FROM blacklists WHERE shop_id = ? AND customer_id = ?',
    [shopId, customerId]
  );
};

const getBlacklistForShop = async (shopId) => {
  const results = await executeQuery(
    'SELECT u.id, u.username, u.email, b.reason, b.created_at FROM blacklists b JOIN users u ON b.customer_id = u.id WHERE b.shop_id = ?',
    [shopId]
  );
  return results;
};

const isCustomerBlacklistedByShop = async (shopId, customerId) => {
  const result = await findOne('blacklists', { shop_id: shopId, customer_id: customerId }, [shopId, customerId]);
  return !!result;
};

module.exports = {
  initializeDatabase,
  executeQuery,
  findById,
  findOne,
  findAll,
  create,
  update,
  remove,
  addToBlacklist,
  removeFromBlacklist,
  getBlacklistForShop,
  isCustomerBlacklistedByShop
};