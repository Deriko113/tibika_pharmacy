const { pool } = require('../config/database');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const path = require('path');
const env = require('../config/getEnv');

// Configure Cloudinary
cloudinary.config({
  cloud_name: env().CLOUDINARY_CLOUD_NAME,
  api_key: env().CLOUDINARY_API_KEY,
  api_secret: env().CLOUDINARY_API_SECRET
});

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and PDF files are allowed'));
    }
  }
}).single('prescription');

exports.uploadPrescription = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    try {
      // Convert buffer to base64 for Cloudinary
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataURI = `data:${req.file.mimetype};base64,${b64}`;
      
      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(dataURI, {
        folder: 'prescriptions',
        resource_type: 'auto'
      });
      
      // Save to database
      const [prescriptionResult] = await pool.query(
        `INSERT INTO prescriptions (user_id, image_url, status)
         VALUES (?, ?, 'pending')`,
        [req.user.id, result.secure_url]
      );
      
      const [newPrescription] = await pool.query(
        `SELECT p.*, u.name as user_name 
         FROM prescriptions p 
         JOIN users u ON p.user_id = u.id 
         WHERE p.id = ?`,
        [prescriptionResult.insertId]
      );
      
      res.status(201).json({
        success: true,
        data: newPrescription[0]
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ message: 'Failed to upload prescription' });
    }
  });
};

exports.getMyPrescriptions = async (req, res) => {
  try {
    const [prescriptions] = await pool.query(
      `SELECT p.*, ph.name as pharmacist_name
       FROM prescriptions p
       LEFT JOIN users ph ON p.pharmacist_id = ph.id
       WHERE p.user_id = ?
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    
    res.json({ success: true, data: prescriptions });
  } catch (error) {
    console.error('Get prescriptions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAllPrescriptions = async (req, res) => {
  try {
    let query = `
      SELECT p.*, u.name as user_name, u.email as user_email, ph.name as pharmacist_name
      FROM prescriptions p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN users ph ON p.pharmacist_id = ph.id
      WHERE 1=1
    `;
    const params = [];
    
    if (req.query.status && req.query.status !== 'all') {
      query += ' AND p.status = ?';
      params.push(req.query.status);
    }
    
    query += ' ORDER BY p.created_at DESC';
    
    const [prescriptions] = await pool.query(query, params);
    
    res.json({ success: true, data: prescriptions });
  } catch (error) {
    console.error('Get all prescriptions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.reviewPrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, pharmacistNotes, medications, rejectionReason } = req.body;
    
    // Update prescription
    await pool.query(
      `UPDATE prescriptions 
       SET status = ?, pharmacist_id = ?, pharmacist_notes = ?, 
           rejection_reason = ?, reviewed_at = NOW()
       WHERE id = ?`,
      [status, req.user.id, pharmacistNotes, rejectionReason, id]
    );
    
    // If approved and medications provided, add to prescription_medications
    if (status === 'approved' && medications && medications.length > 0) {
      // Delete existing
      await pool.query('DELETE FROM prescription_medications WHERE prescription_id = ?', [id]);
      
      // Add new medications
      for (const med of medications) {
        await pool.query(
          `INSERT INTO prescription_medications 
           (prescription_id, medication_name, dosage, frequency, duration, quantity)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [id, med.name, med.dosage, med.frequency, med.duration, med.quantity]
        );
      }
    }
    
    const [updated] = await pool.query(
      'SELECT * FROM prescriptions WHERE id = ?',
      [id]
    );
    
    res.json({ success: true, data: updated[0] });
  } catch (error) {
    console.error('Review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPrescriptionStats = async (req, res) => {
  try {
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'reviewing' THEN 1 ELSE 0 END) as reviewing,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status = 'dispensed' THEN 1 ELSE 0 END) as dispensed
      FROM prescriptions
      WHERE DATE(created_at) >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);
    
    res.json({ success: true, data: stats[0] });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};