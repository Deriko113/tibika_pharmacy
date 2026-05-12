const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescriptionController');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect);

router.post('/upload', prescriptionController.uploadPrescription);
router.get('/my', prescriptionController.getMyPrescriptions);
router.get('/stats', restrictTo('pharmacist', 'admin'), prescriptionController.getPrescriptionStats);
router.get('/all', restrictTo('pharmacist', 'admin'), prescriptionController.getAllPrescriptions);
router.put('/:id/review', restrictTo('pharmacist', 'admin'), prescriptionController.reviewPrescription);

module.exports = router;