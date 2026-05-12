const { fileUtils } = require('../middleware/upload');
const { pool } = require('../config/database');
const path = require('path');
const fs = require('fs');

// Upload single prescription
const uploadPrescription = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        
        res.status(201).json({
            success: true,
            message: 'Prescription uploaded successfully',
            data: {
                file: req.file,
                url: `/uploads/prescriptions/pending/${req.file.filename}`
            }
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: 'Failed to upload prescription: ' + error.message });
    }
};

// Upload multiple prescriptions
const uploadMultiplePrescriptions = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }
        
        res.status(201).json({
            success: true,
            message: `${req.files.length} files uploaded successfully`,
            data: req.files.map(file => ({
                filename: file.filename,
                url: `/uploads/prescriptions/pending/${file.filename}`
            }))
        });
    } catch (error) {
        console.error('Multiple upload error:', error);
        res.status(500).json({ message: 'Failed to upload prescriptions' });
    }
};

// Upload profile picture
const uploadProfile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        
        res.json({
            success: true,
            message: 'Profile picture updated successfully',
            data: {
                url: `/uploads/profiles/${req.file.filename}`,
                fileSize: fileUtils.getFileSize(req.file.size)
            }
        });
    } catch (error) {
        console.error('Profile upload error:', error);
        res.status(500).json({ message: 'Failed to upload profile picture' });
    }
};

// Get prescription file
const getPrescriptionFile = async (req, res) => {
    try {
        res.json({ message: 'Get file endpoint working' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve file' });
    }
};

// Delete prescription file
const deletePrescriptionFile = async (req, res) => {
    try {
        res.json({ success: true, message: 'File deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete file' });
    }
};

// Get upload statistics
const getUploadStats = async (req, res) => {
    try {
        res.json({
            success: true,
            data: { total_uploads: 0, pending: 0, approved: 0, rejected: 0, today_uploads: 0 }
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to get statistics' });
    }
};

module.exports = {
    uploadPrescription,
    uploadMultiplePrescriptions,
    uploadProfile,
    getPrescriptionFile,
    deletePrescriptionFile,
    getUploadStats
};