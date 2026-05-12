const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, restrictTo } = require('../middleware/auth');

// All order routes require authentication
router.use(protect);

// User routes (for patients)
router.post('/', orderController.createOrder);
router.get('/my', orderController.getMyOrders);
router.get('/:id', orderController.getOrderById);

// Admin & Pharmacist routes (make sure all these functions exist in controller)
router.get('/admin/pending', restrictTo('pharmacist', 'admin'), orderController.getPendingOrders);
router.get('/admin/status/:status', restrictTo('pharmacist', 'admin'), orderController.getOrdersByStatus);
router.get('/admin/all', restrictTo('pharmacist', 'admin'), orderController.getAllOrdersForAdmin);
router.get('/admin/stats', restrictTo('pharmacist', 'admin'), orderController.getAdminStats);
router.put('/:id/status', restrictTo('pharmacist', 'admin'), orderController.updateOrderStatus);

module.exports = router;