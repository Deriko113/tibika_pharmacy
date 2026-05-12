const express = require('express');
const router = express.Router();
const medicationController = require('../controllers/medicationController');
const { protect, restrictTo } = require('../middleware/auth');

// Public routes - no authentication required
router.get('/', medicationController.getAllMedications);
router.get('/categories', medicationController.getCategories);
router.get('/:id', medicationController.getMedicationById);

// Protected routes (admin only) - require authentication
router.use(protect);
router.use(restrictTo('admin'));

router.post('/', medicationController.createMedication);
router.put('/:id', medicationController.updateMedication);
router.delete('/:id', medicationController.deleteMedication);
router.patch('/:id/stock', medicationController.updateStock);

module.exports = router;