const jwt = require('jsonwebtoken');
const { config } = require('./config');
const { isCustomerBlacklistedByShop } = require('./models/db'); 
const db = require('./models/db'); 


const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Authorization token required' });

  jwt.verify(token, config.jwtSecret, (err, payload) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });

    const rawId = payload.id ?? payload.userId;
    if (!rawId) return res.status(401).json({ message: 'Token payload missing user id' });

    const normalized = {
      role: payload.role,
      username: payload.username,
      ...payload,
    };

    // map id / userId -> _id เดียว
    let _id = Number(rawId);
    Object.defineProperty(normalized, 'id', {
      get() { return _id; },
      set(v) { _id = Number(v); },
      enumerable: true,
      configurable: true,
    });
    Object.defineProperty(normalized, 'userId', {
      get() { return _id; },
      set(v) { _id = Number(v); },
      enumerable: true,
      configurable: true,
    });

    // ---- NEW: ทำให้มี shop_id เสมอ (fallback เป็น id เมื่อ role=shop) ----
    let _shopId = (() => {
      if (payload.shop_id != null) return Number(payload.shop_id);
      if (payload.shopId  != null) return Number(payload.shopId);
      if ((payload.role || '').toLowerCase() === 'shop') return Number(_id);
      return null; // สำหรับ role อื่น ๆ
    })();
    // เผื่อมีคนส่งมาเป็น query/body/params ก็รับไว้ถ้ายังไม่มี
    if (_shopId == null) {
      const q = req.query?.shop_id ?? req.query?.shopId;
      const b = req.body?.shop_id  ?? req.body?.shopId;
      const p = req.params?.shop_id ?? req.params?.shopId;
      const cand = q ?? b ?? p;
      if (cand != null && !Number.isNaN(Number(cand))) _shopId = Number(cand);
    }

    Object.defineProperty(normalized, 'shop_id', {
      get() { return _shopId; },
      set(v) { _shopId = (v == null ? null : Number(v)); },
      enumerable: true,
      configurable: true,
    });

    req.user = normalized;
    // ให้ controller เก่า ๆ ที่อ่าน req.shopId ใช้ได้ด้วย
    req.shopId = normalized.shop_id ?? null;

    next();
  });
};



// Middleware สำหรับตรวจสอบว่าเป็นร้านเช่ารถ
const isShop = (req, res, next) => {
  if (req.user.role !== 'shop') {
    return res.status(403).json({ message: 'Access denied. Shop role required.' });
  }
  next();
};

// Middleware สำหรับตรวจสอบว่าเป็นลูกค้า
const isCustomer = (req, res, next) => {
  if (req.user.role !== 'customer') {
    return res.status(403).json({ message: 'Access denied. Customer role required.' });
  }
  next();
};

// Middleware สำหรับตรวจสอบ blacklist
const checkBlacklist = async (req, res, next) => {
  if (req.user.role === 'customer') {
    const shopId = req.body.shopId || req.query.shopId || req.params.shopId;
    if (!shopId) {
      return res.status(400).json({ message: 'Shop ID is required' });
    }
    try {
      const isBlacklisted = await isCustomerBlacklistedByShop(Number(shopId), req.user.userId);
      if (isBlacklisted) {
        return res.status(403).json({ message: 'You are blacklisted by this shop and cannot perform this action.' });
      }
    } catch (err) {
      console.error('Error checking blacklist:', err);
      return res.status(500).json({ message: 'Error verifying blacklist status' });
    }
  }
  next();
};

const authOptional = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return next();

  jwt.verify(token, config.jwtSecret, (err, payload) => {
    if (!err && payload) {
      const uid = payload.id ?? payload.userId;
      if (uid) {
        let _id = Number(uid);
        let _shopId = (() => {
          if (payload.shop_id != null) return Number(payload.shop_id);
          if (payload.shopId  != null) return Number(payload.shopId);
          if ((payload.role || '').toLowerCase() === 'shop') return Number(_id);
          return null;
        })();
        if (_shopId == null) {
          const q = req.query?.shop_id ?? req.query?.shopId;
          const b = req.body?.shop_id  ?? req.body?.shopId;
          const p = req.params?.shop_id ?? req.params?.shopId;
          const cand = q ?? b ?? p;
          if (cand != null && !Number.isNaN(Number(cand))) _shopId = Number(cand);
        }

        req.user = {
          id: _id,
          role: payload.role || 'customer',
          username: payload.username,
          shop_id: _shopId,
          ...payload,
        };
        req.shopId = _shopId ?? null;
      }
    }
    return next();
  });
};

const deriveShopIdFromCar = async (req, res, next) => {
  try {
    const carIdFromParam = Number(req.params?.carId);
    const carIdFromBody  = Number(req.body?.car_id);
    const car_id = Number.isFinite(carIdFromParam) ? carIdFromParam : carIdFromBody;

    if (!Number.isFinite(car_id)) {
      return res.status(400).json({ message: 'Invalid car_id' });
    }

    const cars = await db.executeQuery('SELECT * FROM cars WHERE id = ? LIMIT 1', [car_id]);
    const car = cars && cars[0];
    if (!car) return res.status(404).json({ message: 'Car not found' });

    // ใส่ shop_id ลง body ให้ middleware เดิม ๆ เห็น
    req.body.shop_id = car.shop_id;
    next();
  } catch (e) {
    console.error('deriveShopIdFromCar error:', e);
    res.status(500).json({ message: 'Server error: ' + e.message });
  }
};




module.exports = {
  authenticateToken,
  isShop,
  isCustomer,
  checkBlacklist,
  authOptional,
  deriveShopIdFromCar,
};