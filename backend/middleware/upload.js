const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const ensureDirectoryExists = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

// Create all required directories
const uploadDirs = [
    'uploads/prescriptions/pending',
    'uploads/prescriptions/approved',
    'uploads/prescriptions/rejected',
    'uploads/profiles',
    'uploads/temp'
];

uploadDirs.forEach(dir => {
    ensureDirectoryExists(dir);
});

// Configure storage for prescription uploads
const prescriptionStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/prescriptions/pending');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExt = path.extname(file.originalname);
        const fileName = `prescription_${req.user?.id || 'anonymous'}_${uniqueSuffix}${fileExt}`;
        cb(null, fileName);
    }
});

// Configure storage for profile pictures
const profileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/profiles');
    },
    filename: (req, file, cb) => {
        const fileExt = path.extname(file.originalname);
        const fileName = `profile_${req.user.id}_${Date.now()}${fileExt}`;
        cb(null, fileName);
    }
});

// File filter for prescriptions
const prescriptionFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only images and PDF files are allowed'), false);
    }
};

// File filter for images
const imageFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed'), false);
    }
};

// Create multer instances
const uploadPrescription = multer({
    storage: prescriptionStorage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 1
    },
    fileFilter: prescriptionFilter
});

const uploadProfilePicture = multer({
    storage: profileStorage,
    limits: {
        fileSize: 2 * 1024 * 1024, // 2MB
        files: 1
    },
    fileFilter: imageFilter
});

const uploadMultiplePrescriptions = multer({
    storage: prescriptionStorage,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 5
    },
    fileFilter: prescriptionFilter
}).array('prescriptions', 5);

// File utilities
const fileUtils = {
    deleteFile(filePath) {
        return new Promise((resolve, reject) => {
            if (filePath && fs.existsSync(filePath)) {
                fs.unlink(filePath, (err) => {
                    if (err) reject(err);
                    else resolve(true);
                });
            } else {
                resolve(false);
            }
        });
    },
    
    moveFile(oldPath, newPath) {
        return new Promise((resolve, reject) => {
            const newDir = path.dirname(newPath);
            ensureDirectoryExists(newDir);
            fs.rename(oldPath, newPath, (err) => {
                if (err) reject(err);
                else resolve(newPath);
            });
        });
    },
    
    getFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    isImage(filename) {
        const imageExt = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        return imageExt.includes(path.extname(filename).toLowerCase());
    }
};

module.exports = {
    uploadPrescription: uploadPrescription.single('prescription'),
    uploadProfilePicture,
    uploadMultiplePrescriptions,
    fileUtils,
    uploadDirs
};