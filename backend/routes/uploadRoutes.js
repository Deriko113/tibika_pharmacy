const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const ensureDir = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

ensureDir('uploads/prescriptions/pending');
ensureDir('uploads/prescriptions/approved');
ensureDir('uploads/prescriptions/rejected');
ensureDir('uploads/profiles');
ensureDir('uploads/temp');

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/prescriptions/pending');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'prescription_' + req.user.id + '_' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only images and PDF files are allowed'), false);
    }
};

// Create upload middleware
const upload = multer({ 
    storage: storage, 
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: fileFilter
});

// All routes require authentication
router.use(protect);

// Simple upload endpoint
router.post('/prescription', upload.single('prescription'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        
        res.json({
            success: true,
            message: 'Prescription uploaded successfully',
            data: {
                filename: req.file.filename,
                url: `/uploads/prescriptions/pending/${req.file.filename}`,
                size: req.file.size
            }
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: 'Upload failed: ' + error.message });
    }
});

// Multiple upload endpoint
router.post('/prescriptions/multiple', upload.array('prescriptions', 5), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }
        
        const files = req.files.map(file => ({
            filename: file.filename,
            url: `/uploads/prescriptions/pending/${file.filename}`,
            size: file.size
        }));
        
        res.json({
            success: true,
            message: `${files.length} files uploaded successfully`,
            data: files
        });
    } catch (error) {
        console.error('Multiple upload error:', error);
        res.status(500).json({ message: 'Upload failed: ' + error.message });
    }
});

// Profile picture upload
const profileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/profiles');
    },
    filename: (req, file, cb) => {
        cb(null, 'profile_' + req.user.id + '_' + Date.now() + path.extname(file.originalname));
    }
});

const profileUpload = multer({ 
    storage: profileStorage, 
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'), false);
        }
    }
});

router.post('/profile', profileUpload.single('profile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        
        // Update user's profile image in database
        const { pool } = require('../config/database');
        await pool.query('UPDATE users SET profile_image = ? WHERE id = ?', [req.file.path, req.user.id]);
        
        res.json({
            success: true,
            message: 'Profile picture updated successfully',
            data: {
                url: `/uploads/profiles/${req.file.filename}`
            }
        });
    } catch (error) {
        console.error('Profile upload error:', error);
        res.status(500).json({ message: 'Upload failed: ' + error.message });
    }
});

// Get file endpoint
router.get('/prescription/:id', async (req, res) => {
    try {
        const { pool } = require('../config/database');
        const [prescription] = await pool.query('SELECT image_url FROM prescriptions WHERE id = ?', [req.params.id]);
        
        if (!prescription[0] || !fs.existsSync(prescription[0].image_url)) {
            return res.status(404).json({ message: 'File not found' });
        }
        
        res.sendFile(path.resolve(prescription[0].image_url));
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve file' });
    }
});

// Delete file endpoint
router.delete('/prescription/:id', async (req, res) => {
    try {
        const { pool } = require('../config/database');
        const [prescription] = await pool.query('SELECT image_url FROM prescriptions WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        
        if (prescription[0]) {
            if (fs.existsSync(prescription[0].image_url)) {
                fs.unlinkSync(prescription[0].image_url);
            }
            await pool.query('DELETE FROM prescriptions WHERE id = ?', [req.params.id]);
        }
        
        res.json({ success: true, message: 'File deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete file' });
    }
});

module.exports = router;