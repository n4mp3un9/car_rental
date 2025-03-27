// ไฟล์ backend/server.js
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

// โหลดค่าจาก .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT ;
const JWT_SECRET = process.env.JWT_SECRET ;

// Middleware
app.use(cors());
app.use(express.json());

// การเชื่อมต่อกับ MySQL
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME
};

// สร้าง pool connection เพื่อจัดการการเชื่อมต่อ
const pool = mysql.createPool(dbConfig);

// ตรวจสอบการเชื่อมต่อ
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Database connection successful');
    connection.release();
  } catch (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }
}

// สร้างตาราง users ถ้ายังไม่มี
async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Database initialized successfully');
    connection.release();
  } catch (err) {
    console.error('Error initializing database:', err);
    process.exit(1);
  }
}

// Middleware สำหรับตรวจสอบ token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Authorization token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Route สำหรับการลงทะเบียน
app.post('/api/register', async (req, res) => {
    const { 
      username, 
      email, 
      password, 
      role = 'customer',
      phone,
      address,
      shop_name
    } = req.body;
    
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    try {
      // Hash รหัสผ่าน
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // เตรียมข้อมูลสำหรับการบันทึกลงฐานข้อมูล
      let userData = {
        username,
        email,
        password: hashedPassword,
        role
      };
  
      // เพิ่มข้อมูลเพิ่มเติมตามประเภทผู้ใช้งาน
      if (phone) userData.phone = phone;
      if (address) userData.address = address;
      
      // ถ้าเป็นร้านเช่ารถ ต้องมีข้อมูลเพิ่มเติม
      if (role === 'shop') {
        if (!shop_name) {
          return res.status(400).json({ message: 'Shop name is required for shop accounts' });
        }
        userData.shop_name = shop_name;
      }
      
      // บันทึกข้อมูลผู้ใช้ลงในฐานข้อมูล
      const columns = Object.keys(userData).join(', ');
      const placeholders = Object.keys(userData).map(() => '?').join(', ');
      const values = Object.values(userData);
      
      const [result] = await pool.query(
        `INSERT INTO users (${columns}) VALUES (${placeholders})`,
        values
      );
      
      res.status(201).json({ 
        message: 'User registered successfully',
        userId: result.insertId 
      });
    } catch (err) {
      // ตรวจสอบ error duplicate entry
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'Username or email already exists' });
      }
      console.error('Registration error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  });

// Route สำหรับการล็อกอิน
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  // ตรวจสอบข้อมูลที่ส่งมา
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }
  
  try {
    // ค้นหาผู้ใช้จากฐานข้อมูล
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    
    // ตรวจสอบว่ามีผู้ใช้หรือไม่
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    const user = rows[0];
    
    // เปรียบเทียบรหัสผ่าน
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    // สร้าง JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // ส่ง token กลับไป
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route สำหรับการดึงข้อมูลผู้ใช้ที่ล็อกอินแล้ว
app.get('/api/me', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, username, email, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({
      user: rows[0]
    });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// เริ่มต้นการทำงานของ server
async function startServer() {
  await testConnection();
  await initializeDatabase();
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();