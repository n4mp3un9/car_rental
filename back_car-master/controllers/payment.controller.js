const db = require('../models/db');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const promptPayQR = require('promptpay-qr');

// Validate PromptPay ID (phone number or ID card)
const validatePromptPay = (promptpayId) => {
  if (!promptpayId) return false;

  const digitsOnly = promptpayId.replace(/\D/g, '');

  // Validate phone number (10 digits, starts with 0)
  if (digitsOnly.length === 10) {
    return /^0[1-9]\d{8}$/.test(digitsOnly);
  }
  // Validate ID card (13 digits)
  if (digitsOnly.length === 13) {
    return /^\d{13}$/.test(digitsOnly);
  }

  return false;
};

// Get payment information for a rental
const getPaymentInfo = async (req, res) => {
  try {
    const { rentalId } = req.params;

    console.log('Fetching payment info for rental ID:', rentalId);

    // Fetch rental details
    const [rental] = await db.executeQuery(
      `SELECT r.*, c.brand, c.model, c.year, c.image_url,
              u.shop_name, u.promptpay_id as shop_promptpay_id
       FROM rentals r
       JOIN cars c ON r.car_id = c.id
       JOIN users u ON r.shop_id = u.id
       WHERE r.id = ? AND r.customer_id = ?`,
      [rentalId, req.user.id]
    );

    if (!rental) {
      console.log('Rental not found or customer lacks access');
      return res.status(404).json({ message: 'ไม่พบข้อมูลการจองหรือคุณไม่มีสิทธิ์เข้าถึง' });
    }

    console.log('Rental found:', rental);

    // Validate PromptPay ID
    const promptpayId = rental.shop_promptpay_id;
    console.log('Shop PromptPay ID:', promptpayId);

    if (!promptpayId) {
      console.log('No PromptPay ID found for this shop');
      return res.status(400).json({ message: 'ไม่พบข้อมูล PromptPay สำหรับร้านเช่ารถนี้ กรุณาติดต่อผู้ดูแลระบบ' });
    }

    if (!validatePromptPay(promptpayId)) {
      console.log('Invalid PromptPay ID format:', promptpayId);
      return res.status(400).json({ message: 'รูปแบบ PromptPay ID ไม่ถูกต้อง กรุณาติดต่อร้านค้า' });
    }

    // Calculate rental duration
    const startDate = new Date(rental.start_date);
    const endDate = new Date(rental.end_date);
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

    // Check existing payment
    const [payment] = await db.executeQuery('SELECT * FROM payments WHERE rental_id = ?', [rentalId]);
    console.log('Existing payment:', payment);

    // Return payment information
    res.status(200).json({
      rental: {
        id: rental.id,
        car_id: rental.car_id,
        start_date: rental.start_date,
        end_date: rental.end_date,
        total_amount: parseFloat(rental.total_amount),
        days,
        brand: rental.brand,
        model: rental.model,
        year: rental.year,
        image_url: rental.image_url,
      },
      shop_name: rental.shop_name,
      promptpay_id: promptpayId,
      total_amount: parseFloat(rental.total_amount),
    });
  } catch (err) {
    console.error('Error fetching payment info:', err);
    res.status(500).json({ message: `เกิดข้อผิดพลาดบนเซิร์ฟเวอร์: ${err.message}` });
  }
};

// Upload payment proof
const uploadPaymentProof = async (req, res) => {
  try {
    const { rentalId } = req.params;

    // Check if file is provided
    if (!req.file) {
      return res.status(400).json({ message: 'กรุณาอัปโหลดหลักฐานการชำระเงิน' });
    }

    // Create file URL
    const proofImageUrl = `/uploads/payments/${req.file.filename}`;

    // Verify rental exists
    const [rental] = await db.executeQuery(
      'SELECT * FROM rentals WHERE id = ? AND customer_id = ?',
      [rentalId, req.user.id]
    );

    if (!rental) {
      // Delete uploaded file if rental not found
      fs.unlinkSync(path.join(__dirname, '../../uploads/payments', req.file.filename));
      return res.status(404).json({ message: 'ไม่พบข้อมูลการจองหรือคุณไม่มีสิทธิ์เข้าถึง' });
    }

    // Update or create payment record
    const [payment] = await db.executeQuery('SELECT * FROM payments WHERE rental_id = ?', [rentalId]);

    if (payment) {
      // Update existing payment
      await db.update('payments', payment.id, {
        payment_status: 'pending_verification',
        proof_image: proofImageUrl,
        payment_date: new Date(),
      });
    } else {
      // Create new payment
      await db.create('payments', {
        rental_id: rentalId,
        amount: parseFloat(rental.total_amount),
        payment_status: 'pending_verification',
        payment_method: 'promptpay',
        proof_image: proofImageUrl,
        payment_date: new Date(),
      });
    }

    // Update rental payment status
    await db.update('rentals', rentalId, {
      payment_status: 'pending_verification',
    });

    res.status(200).json({
      message: 'อัปโหลดหลักฐานการชำระเงินสำเร็จ',
      redirect_to: `/customer/bookings/${rentalId}`,
    });
  } catch (err) {
    console.error('Upload payment proof error:', err);
    // Delete file if error occurs
    if (req.file) {
      fs.unlinkSync(path.join(__dirname, '../../Uploads/payments', req.file.filename));
    }
    res.status(500).json({ message: `เกิดข้อผิดพลาดบนเซิร์ฟเวอร์: ${err.message}` });
  }
};

// Verify payment (for shop)
const verifyPayment = async (req, res) => {
  try {
    const { rentalId } = req.params;
    const { approve } = req.body;

    if (approve === undefined) {
      return res.status(400).json({ message: 'ต้องระบุสถานะการอนุมัติ' });
    }

    // Verify rental exists
    const [rental] = await db.executeQuery(
      'SELECT * FROM rentals WHERE id = ? AND shop_id = ?',
      [rentalId, req.user.id]
    );

    if (!rental) {
      return res.status(404).json({ message: 'ไม่พบข้อมูลการจองหรือคุณไม่มีสิทธิ์เข้าถึง' });
    }

    // Verify payment exists
    const [payment] = await db.executeQuery('SELECT * FROM payments WHERE rental_id = ?', [rentalId]);

    if (!payment || payment.payment_status !== 'pending_verification') {
      return res.status(400).json({ message: 'ไม่พบการชำระเงินที่รอการยืนยัน' });
    }

    // Update payment and rental status
    const paymentStatus = approve ? 'paid' : 'rejected';
    const rentalStatus = approve ? 'confirmed' : 'pending';

    await db.update('payments', payment.id, {
      payment_status: paymentStatus,
      verified_at: new Date(),
      verified_by: req.user.id,
    });

    await db.update('rentals', rentalId, {
      payment_status: paymentStatus,
      rental_status: rentalStatus,
    });

    // Update car status if approved
    if (approve) {
      await db.update('cars', rental.car_id, {
        status: 'rented',
      });
    }

    res.status(200).json({
      message: approve ? 'อนุมัติการชำระเงินสำเร็จ' : 'ปฏิเสธการชำระเงิน',
      status: approve ? 'approved' : 'rejected',
    });
  } catch (err) {
    console.error('Verify payment error:', err);
    res.status(500).json({ message: `เกิดข้อผิดพลาดบนเซิร์ฟเวอร์: ${err.message}` });
  }
};

// Get pending payments (for shop)
const getPendingPayments = async (req, res) => {
  try {
    const shopId = req.user.id;

    const payments = await db.executeQuery(
      `SELECT p.*, r.car_id, r.customer_id, r.start_date, r.end_date, r.total_amount,
              c.brand, c.model, c.year, c.license_plate, c.image_url,
              u.username as customer_name, u.email as customer_email, u.phone as customer_phone
       FROM payments p
       JOIN rentals r ON p.rental_id = r.id
       JOIN cars c ON r.car_id = c.id
       JOIN users u ON r.customer_id = u.id
       WHERE r.shop_id = ? AND p.payment_status = 'pending_verification'
       ORDER BY p.payment_date DESC`,
      [shopId]
    );

    res.status(200).json({ payments });
  } catch (err) {
    console.error('Get pending payments error:', err);
    res.status(500).json({ message: `เกิดข้อผิดพลาดบนเซิร์ฟเวอร์: ${err.message}` });
  }
};

// Get payment history (for shop)
const getPaymentHistory = async (req, res) => {
  try {
    const shopId = req.user.id;
    const { status } = req.query;

    let query = `
      SELECT p.*, r.car_id, r.customer_id, r.start_date, r.end_date, r.total_amount,
             c.brand, c.model, c.year, c.license_plate, c.image_url,
             u.username as customer_name, u.email as customer_email, u.phone as customer_phone
      FROM payments p
      JOIN rentals r ON p.rental_id = r.id
      JOIN cars c ON r.car_id = c.id
      JOIN users u ON r.customer_id = u.id
      WHERE r.shop_id = ?`;
    const params = [shopId];

    if (status) {
      query += ` AND p.payment_status = ?`;
      params.push(status);
    }

    query += ` ORDER BY p.payment_date DESC`;

    const payments = await db.executeQuery(query, params);

    res.status(200).json({ payments });
  } catch (err) {
    console.error('Get payment history error:', err);
    res.status(500).json({ message: `เกิดข้อผิดพลาดบนเซิร์ฟเวอร์: ${err.message}` });
  }
};

// Generate PromptPay QR code
const generatePromptPayQR = async (req, res) => {
  try {
    const { rentalId } = req.params;

    console.log('Generating PromptPay QR code for rental ID:', rentalId);

    // Fetch rental details
    const [rental] = await db.executeQuery(
      `SELECT r.*, c.brand, c.model, c.year,
              u.shop_name, u.promptpay_id as shop_promptpay_id
       FROM rentals r
       JOIN cars c ON r.car_id = c.id
       JOIN users u ON r.shop_id = u.id
       WHERE r.id = ? AND r.customer_id = ?`,
      [rentalId, req.user.id]
    );

    if (!rental) {
      console.log('Rental not found or customer lacks access');
      return res.status(404).json({ message: 'ไม่พบข้อมูลการจองหรือคุณไม่มีสิทธิ์เข้าถึง' });
    }

    // Validate PromptPay ID
    const promptpayId = rental.shop_promptpay_id;
    console.log('Shop PromptPay ID:', promptpayId);

    if (!promptpayId) {
      console.log('No PromptPay ID found for this shop');
      return res.status(400).json({ message: 'ไม่พบข้อมูล PromptPay สำหรับร้านเช่ารถนี้' });
    }

    if (!validatePromptPay(promptpayId)) {
      console.log('Invalid PromptPay ID format:', promptpayId);
      return res.status(400).json({ message: 'รูปแบบ PromptPay ID ไม่ถูกต้อง กรุณาติดต่อร้านค้า' });
    }

    // Generate PromptPay payload
    const amount = parseFloat(rental.total_amount);
    const payload = promptPayQR(promptpayId, { amount });

    console.log('PromptPay payload:', payload);

    // Generate QR code
    const qrCodeDataURL = await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      width: 256,
    });

    console.log('QR code generated successfully');

    res.status(200).json({
      qr_code: qrCodeDataURL,
      promptpay_id: promptpayId,
      amount,
      shop_name: rental.shop_name,
      rental_info: {
        id: rental.id,
        brand: rental.brand,
        model: rental.model,
        year: rental.year,
        start_date: rental.start_date,
        end_date: rental.end_date,
      },
    });
  } catch (err) {
    console.error('Error generating QR code:', err);
    res.status(500).json({ message: `เกิดข้อผิดพลาดบนเซิร์ฟเวอร์: ${err.message}` });
  }
};

module.exports = {
  getPaymentInfo,
  uploadPaymentProof,
  verifyPayment,
  getPendingPayments,
  getPaymentHistory,
  generatePromptPayQR,
};