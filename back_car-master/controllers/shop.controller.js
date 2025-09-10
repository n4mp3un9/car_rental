// server/controllers/shop.controller.js
const db = require('../models/db');

function blacklistShopWhereForCustomer(req) {
  if (req.user?.role === 'customer' && req.user?.id) {
    return {
      clause: `
        AND NOT EXISTS (
          SELECT 1
          FROM blacklists b
          WHERE b.shop_id = u.id
            AND b.customer_id = ?
        )
      `,
      params: [Number(req.user.id)],
    };
  }
  return { clause: '', params: [] };
}

// ดึงรายการร้านเช่ารถ
const getShops = async (req, res) => {
  try {
    const isCustomer = req.user?.role === 'customer';
    const params = [];
    let query = `
      SELECT u.id, u.username, u.shop_name, u.address, u.profile_image,
             COUNT(CASE WHEN c.status NOT IN ('hidden','deleted') THEN c.id END) AS car_count
      FROM users u
      LEFT JOIN cars c
        ON u.id = c.shop_id
      ${isCustomer ? 'LEFT JOIN blacklists b ON b.shop_id = u.id AND b.customer_id = ?' : ''}
      WHERE u.role = 'shop' AND u.status = 'active'
      ${isCustomer ? 'AND b.shop_id IS NULL' : ''}
      GROUP BY u.id
      ORDER BY car_count DESC, u.created_at DESC
    `;

    if (isCustomer) params.push(Number(req.user.id));

    const shops = await db.executeQuery(query, params);
    res.status(200).json({ shops });
  } catch (err) {
    console.error('Get shops error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};



// ค้นหาร้านเช่ารถ
const searchShops = async (req, res) => {
  try {
    const isCustomer = req.user?.role === 'customer';
    const params = [];

    let query = `
      SELECT u.id, u.username, u.shop_name, u.address, u.profile_image,
             COUNT(CASE WHEN c.status NOT IN ('hidden','deleted') THEN c.id END) AS car_count
      FROM users u
      LEFT JOIN cars c ON u.id = c.shop_id
      ${isCustomer ? 'LEFT JOIN blacklists b ON b.shop_id = u.id AND b.customer_id = ?' : ''}
      WHERE u.role = 'shop' AND u.status = 'active'
    `;

    if (isCustomer) params.push(Number(req.user.id));

    if (req.query.q) {
      query += ' AND (u.shop_name LIKE ? OR u.username LIKE ?)';
      params.push(`%${req.query.q}%`, `%${req.query.q}%`);
    }

    query += `
      ${isCustomer ? 'AND b.shop_id IS NULL' : ''}
      GROUP BY u.id
      ORDER BY car_count DESC, u.created_at DESC
    `;

    if (req.query.limit) {
      query += ' LIMIT ?';
      params.push(Number(req.query.limit));
    }

    const shops = await db.executeQuery(query, params);
    res.status(200).json({ shops });
  } catch (err) {
    console.error('Search shops error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};



// ดึงข้อมูลร้านเช่ารถตามไอดี
const getShopById = async (req, res) => {
  try {
    const shopId = req.params.shopId;
    
    // ดึงข้อมูลร้านเช่ารถ
    const [shop] = await db.executeQuery(
      `SELECT id, username, shop_name, shop_description, address, phone, profile_image, created_at
       FROM users 
       WHERE id = ? AND role = 'shop' AND status = 'active'`,
      [shopId]
    );
    
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }
    
    // ดึงรถยนต์ทั้งหมดในร้าน
    const cars = await db.executeQuery(
      `SELECT * FROM cars WHERE shop_id = ? AND status = 'available' ORDER BY created_at DESC`,
      [shopId]
    );
    
    // ดึงรูปภาพของรถยนต์แต่ละคัน
    for (const car of cars) {
      const images = await db.executeQuery(
        'SELECT * FROM car_images WHERE car_id = ?',
        [car.id]
      );
      car.images = images;
    }
    
    shop.cars = cars;
    
    res.status(200).json({
      shop
    });
    
  } catch (err) {
    console.error('Get shop error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// อัปโหลดรูปโปรไฟล์ร้าน
const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const userId = req.user.id;
    const imageUrl = `/uploads/${req.file.filename}`;
    
    // อัปเดตรูปโปรไฟล์ในฐานข้อมูล
    const result = await db.update('users', userId, { profile_image: imageUrl });
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({
      message: 'Profile image uploaded successfully',
      imageUrl
    });
    
  } catch (err) {
    console.error('Upload profile image error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ดึงข้อมูลโปรไฟล์ร้านค้า
const getProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'ไม่ได้รับอนุญาต' });
    }

    const rows = await db.executeQuery(
      `SELECT id, username, email, role, phone, address, profile_image,
              shop_name, shop_description, promptpay_id, policy, status, created_at
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [userId]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: 'ไม่พบข้อมูลผู้ใช้' });
    }

    const r = rows[0];

    // นอร์มัลไลซ์ค่าให้หน้าบ้านใช้ง่าย
    const user = {
      id: r.id,
      username: r.username,
      email: r.email,
      role: r.role,
      phone: r.phone ?? null,
      address: r.address ?? null,
      profile_image: r.profile_image ?? null,
      shop_name: r.shop_name ?? null,
      shop_description: r.shop_description ?? null,
      promptpay_id: r.promptpay_id ? String(r.promptpay_id) : null,
      policy: r.policy ?? null,               // ✅ policy (TEXT)
      status: r.status,
      created_at: r.created_at
    };

    return res.status(200).json({
      message: 'ดึงข้อมูลโปรไฟล์สำเร็จ',
      user
    });
  } catch (err) {
    console.error('Get profile error:', err);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
};

const getShopPolicy = async (req, res) => {
  try {
    const { shopId } = req.params;
    const rows = await db.executeQuery(
      "SELECT policy, status FROM users WHERE id = ? AND role = 'shop' LIMIT 1",
      [shopId]
    );
    if (!rows.length) return res.status(404).json({ message: 'ไม่พบร้านค้า' });
    if (rows[0].status !== 'active') return res.status(403).json({ message: 'ร้านค้านี้ไม่เปิดใช้งาน' });
    return res.status(200).json({ shop_id: Number(shopId), policy: rows[0].policy ?? '' });
  } catch (e) {
    console.error('Get shop policy error:', e);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
};



const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, email, shop_name, phone, address, promptpay_id, policy } = req.body;

    // ตรวจคอลัมน์บังคับ (ให้ตรงกับฟรอนต์ที่ส่งมาทุกครั้ง)
    if (!username || !email || !shop_name) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน (ชื่อผู้ใช้, อีเมล, ชื่อร้านค้า)' });
    }

    // ตรวจซ้ำ username/email ของผู้ใช้อื่น
    const dup = await db.executeQuery(
      'SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ? LIMIT 1',
      [username, email, userId]
    );
    if (dup.length > 0) {
      return res.status(400).json({ message: 'ชื่อผู้ใช้หรืออีเมลนี้ถูกใช้งานแล้ว' });
    }

    // Clean + validate PromptPay
    const cleanedPP = (promptpay_id ?? '').replace(/\D/g, ''); // เก็บเลขล้วน
    if (cleanedPP.length > 0) {
      const promptpayRegex = /^[0-9]{10,13}$/;
      if (!promptpayRegex.test(cleanedPP)) {
        return res.status(400).json({ message: 'หมายเลข PromptPay ต้องเป็นตัวเลข 10-13 หลัก' });
      }
    }

    // ตรวจ policy (optional)
    let policyValue = null;
    if (policy !== undefined && policy !== null) {
      const allowedPolicies = ['accept', 'decline']; // หรือเปลี่ยนตาม enum ที่ตั้งไว้ใน MySQL
      if (!allowedPolicies.includes(policy)) {
        return res.status(400).json({ message: 'ค่านโยบายไม่ถูกต้อง' });
      }
      policyValue = policy;
    }

    // เตรียมข้อมูลอัปเดต (ปล่อยให้ NULL ถ้าล้างช่อง)
    const updateData = {
      username: username.trim(),
      email: email.trim(),
      shop_name: shop_name.trim(),
      phone: (phone ?? '').toString().trim() || null,
      address: (address ?? '').toString().trim() || null,
      promptpay_id: cleanedPP.length ? cleanedPP : null,
      policy: (policy ?? '').toString().trim() || null   // ✅ เพิ่มตรงนี้
    };

    const result = await db.update('users', userId, updateData);

    // หมายเหตุ: ถ้าค่าเหมือนเดิม MySQL อาจรายงาน affectedRows=0 → ไม่ถือว่า fail
    if (result.affectedRows === 0) {
      // ตรวจว่ามีผู้ใช้อยู่จริงไหม
      const exist = await db.executeQuery('SELECT id FROM users WHERE id = ? LIMIT 1', [userId]);
      if (exist.length === 0) {
        return res.status(404).json({ message: 'ไม่พบข้อมูลผู้ใช้' });
      }
    }

    // ดึงข้อมูลล่าสุดส่งกลับ
    const rows = await db.executeQuery(
      `SELECT id, username, email, role, phone, address, profile_image,
              shop_name, shop_description, promptpay_id, policy, created_at
       FROM users WHERE id = ? LIMIT 1`,
      [userId]
    );
    const user = rows[0];

    return res.status(200).json({
      message: 'อัพเดทข้อมูลโปรไฟล์สำเร็จ',
      user,
    });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }

};

const normalizePolicy = (s) => String(s ?? '').replace(/\r\n/g, '\n').trim();

const ensureShop = async (userId) => {
  const rows = await db.executeQuery('SELECT id, role, policy FROM users WHERE id = ? LIMIT 1', [userId]);
  if (!rows.length) return { err: { code: 404, msg: 'ไม่พบผู้ใช้' } };
  if (rows[0].role !== 'shop') return { err: { code: 403, msg: 'อนุญาตเฉพาะบัญชีร้านค้าเท่านั้น' } };
  return { user: rows[0] };
};

const validatePolicy = (policy) => {
  if (typeof policy !== 'string') return 'กรุณาส่ง policy เป็นข้อความ (string)';
  const text = normalizePolicy(policy);
  if (!text) return 'กรุณากรอกนโยบาย (policy) ไม่ควรเว้นว่าง';
  if (/<script\b/i.test(text)) return 'ห้ามใช้งานแท็ก <script> ในข้อความนโยบาย';
  if (Buffer.byteLength(text, 'utf8') > 65535) return 'นโยบายยาวเกินไป (เกิน 65,535 ไบต์)';
  return null;
};

// POST /shop/policy  → สร้าง (ต้องยังไม่มี policy)
const createPolicy = async (req, res) => {
  try {
    const userId = req.user.id;
    const { user, err } = await ensureShop(userId);
    if (err) return res.status(err.code).json({ message: err.msg });

    if (user.policy && user.policy.trim()) {
      return res.status(409).json({ message: 'มีนโยบายอยู่แล้ว กรุณาใช้การแก้ไข' });
    }

    const { policy } = req.body;
    const invalid = validatePolicy(policy);
    if (invalid) return res.status(400).json({ message: invalid });

    const text = normalizePolicy(policy);
    await db.executeQuery('UPDATE users SET policy = ? WHERE id = ?', [text, userId]);

    return res.status(201).json({ message: 'สร้างนโยบายสำเร็จ', policy: text });
  } catch (e) {
    console.error('Create policy error:', e);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
};

// PUT /shop/policy  → แก้ไข (ต้องมี policy เดิมอยู่ก่อน)
const updatePolicy = async (req, res) => {
  try {
    const userId = req.user.id;
    const { user, err } = await ensureShop(userId);
    if (err) return res.status(err.code).json({ message: err.msg });

    if (!user.policy || !user.policy.trim()) {
      return res.status(404).json({ message: 'ยังไม่มีนโยบายเดิม กรุณาใช้การสร้าง' });
    }

    const { policy } = req.body;
    const invalid = validatePolicy(policy);
    if (invalid) return res.status(400).json({ message: invalid });

    const text = normalizePolicy(policy);
    await db.executeQuery('UPDATE users SET policy = ? WHERE id = ?', [text, userId]);

    return res.status(200).json({ message: 'แก้นโยบายสำเร็จ', policy: text });
  } catch (e) {
    console.error('Update policy error:', e);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
};






module.exports = {
  getShops,
  searchShops,
  getShopById,
  uploadProfileImage,
  getProfile,
  updateProfile,
  createPolicy,
  updatePolicy,
  getShopPolicy
};