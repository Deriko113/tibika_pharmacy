const { pool } = require('../config/database');

// Generate unique order number with KE prefix
const generateOrderNumber = () => {
    return 'KE-ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();
};

// Kenya counties for shipping
const KENYA_COUNTIES = [
    'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Kiambu', 'Machakos', 'Kajiado', 
    'Uasin Gishu', 'Kakamega', 'Bungoma', 'Meru', 'Nyeri', 'Kilifi', 'Kwale', 
    'Turkana', 'West Pokot', 'Samburu', 'Trans Nzoia', 'Elgeyo Marakwet', 
    'Nandi', 'Baringo', 'Laikipia', 'Kirinyaga', 'Muranga', 'Nyandarua', 
    'Embu', 'Tharaka Nithi', 'Tana River', 'Garissa', 'Wajir', 'Mandera', 
    'Marsabit', 'Isiolo', 'Kitui', 'Makueni', 'Kisii', 'Nyamira', 'Homa Bay', 
    'Siaya', 'Migori', 'Busia', 'Vihiga', 'Bomet', 'Kericho'
];

// Calculate delivery fee based on county
const calculateDeliveryFee = (county) => {
    const fees = {
        'Nairobi': 150,
        'Mombasa': 300,
        'Kisumu': 250,
        'Nakuru': 200,
        'Kiambu': 180,
        'Machakos': 180,
        'Kajiado': 200
    };
    return fees[county] || 250;
};

// Get Kenya counties
exports.getCounties = async (req, res) => {
    try {
        res.json({
            success: true,
            data: KENYA_COUNTIES
        });
    } catch (error) {
        console.error('Get counties error:', error);
        res.status(500).json({ message: 'Failed to fetch counties' });
    }
};

// Calculate delivery fee
exports.calculateDelivery = async (req, res) => {
    try {
        const { county } = req.body;
        const fee = calculateDeliveryFee(county);
        res.json({
            success: true,
            delivery_fee: fee,
            currency: 'KES'
        });
    } catch (error) {
        console.error('Calculate delivery error:', error);
        res.status(500).json({ message: 'Failed to calculate delivery fee' });
    }
};

// Create new order
exports.createOrder = async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { payment_method, shipping_address, mpesa_number } = req.body;
        
        console.log('Creating order with:', { payment_method, shipping_address, mpesa_number });
        
        // Get cart items
        const [cartItems] = await connection.query(
            `SELECT c.id as cart_id, c.quantity, 
                    m.id as medication_id, m.name, m.price, 
                    m.requires_prescription, m.stock_quantity
             FROM cart c
             JOIN medications m ON c.medication_id = m.id
             WHERE c.user_id = ?`,
            [req.user.id]
        );
        
        if (cartItems.length === 0) {
            await connection.rollback();
            return res.status(400).json({ message: 'Your cart is empty' });
        }
        
        // Calculate totals
        let subtotal = 0;
        for (const item of cartItems) {
            if (item.stock_quantity < item.quantity) {
                await connection.rollback();
                return res.status(400).json({ 
                    message: `${item.name} has insufficient stock. Available: ${item.stock_quantity}` 
                });
            }
            subtotal += parseFloat(item.price) * parseInt(item.quantity);
        }
        
        const taxRate = 0.16;
        const tax = subtotal * taxRate;
        const deliveryFee = calculateDeliveryFee(shipping_address?.county);
        const total = subtotal + tax + deliveryFee;
        const orderNumber = generateOrderNumber();
        
        // Get user's address if not provided
        let address = shipping_address;
        if (!address || !address.street) {
            const [user] = await connection.query(
                'SELECT street, city, county, estate, phone FROM users WHERE id = ?',
                [req.user.id]
            );
            address = user[0];
        }
        
        // Create order - SIMPLE VERSION with fewer columns to avoid syntax errors
        const [orderResult] = await connection.query(
            `INSERT INTO orders (
                order_number, 
                user_id, 
                subtotal, 
                tax, 
                delivery_fee, 
                total, 
                payment_method, 
                payment_status, 
                status,
                shipping_street, 
                shipping_city, 
                mpesa_number
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                orderNumber, 
                req.user.id, 
                subtotal, 
                tax, 
                deliveryFee, 
                total,
                payment_method, 
                'pending', 
                'pending',
                address?.street || null, 
                address?.city || null, 
                mpesa_number || null
            ]
        );
        
        // Add order items and update stock
        for (const item of cartItems) {
            await connection.query(
                `INSERT INTO order_items (
                    order_id, 
                    medication_id, 
                    medication_name, 
                    quantity, 
                    price, 
                    requires_prescription
                ) VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    orderResult.insertId, 
                    item.medication_id, 
                    item.name, 
                    item.quantity, 
                    item.price, 
                    item.requires_prescription
                ]
            );
            
            // Update stock
            await connection.query(
                'UPDATE medications SET stock_quantity = stock_quantity - ? WHERE id = ?',
                [item.quantity, item.medication_id]
            );
        }
        
        // Clear cart
        await connection.query('DELETE FROM cart WHERE user_id = ?', [req.user.id]);
        
        await connection.commit();
        
        // Get the complete order
        const [newOrder] = await connection.query(
            'SELECT * FROM orders WHERE id = ?',
            [orderResult.insertId]
        );
        
        const [orderItems] = await connection.query(
            'SELECT * FROM order_items WHERE order_id = ?',
            [orderResult.insertId]
        );
        
        res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            data: {
                ...newOrder[0],
                items: orderItems,
                currency: 'KES'
            }
        });
        
    } catch (error) {
        await connection.rollback();
        console.error('Create order error:', error);
        res.status(500).json({ 
            message: 'Failed to create order: ' + error.message
        });
    } finally {
        connection.release();
    }
};

// Get user's orders
exports.getMyOrders = async (req, res) => {
    try {
        const [orders] = await pool.query(
            `SELECT o.*, COUNT(oi.id) as item_count
             FROM orders o
             LEFT JOIN order_items oi ON o.id = oi.order_id
             WHERE o.user_id = ?
             GROUP BY o.id
             ORDER BY o.created_at DESC`,
            [req.user.id]
        );
        
        res.json({
            success: true,
            data: orders,
            currency: 'KES'
        });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ message: 'Failed to fetch orders' });
    }
};

// Get single order by ID
exports.getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [orders] = await pool.query(
            `SELECT o.*, u.name as user_name, u.email as user_email, u.phone as user_phone
             FROM orders o
             JOIN users u ON o.user_id = u.id
             WHERE o.id = ?`,
            [id]
        );
        
        if (orders.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        const order = orders[0];
        
        if (order.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        const [items] = await pool.query(
            'SELECT * FROM order_items WHERE order_id = ?',
            [id]
        );
        order.items = items;
        
        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({ message: 'Failed to fetch order' });
    }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, tracking_number } = req.body;
        
        let estimated_delivery = null;
        if (status === 'shipped') {
            estimated_delivery = new Date();
            estimated_delivery.setDate(estimated_delivery.getDate() + 3);
        }
        
        await pool.query(
            `UPDATE orders 
             SET status = ?, tracking_number = ?, estimated_delivery = ?
             WHERE id = ?`,
            [status, tracking_number || null, estimated_delivery, id]
        );
        
        res.json({ 
            success: true, 
            message: 'Order status updated successfully' 
        });
    } catch (error) {
        console.error('Update order error:', error);
        res.status(500).json({ message: 'Failed to update order status' });
    }
};

// Get order statistics
exports.getOrderStats = async (req, res) => {
    try {
        const [stats] = await pool.query(`
            SELECT 
                COUNT(*) as total_orders,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
                SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing_orders,
                SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) as shipped_orders,
                SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders,
                SUM(CASE WHEN payment_status = 'paid' THEN total ELSE 0 END) as total_revenue
            FROM orders
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        `);
        
        const [recentOrders] = await pool.query(`
            SELECT o.*, u.name as user_name
            FROM orders o
            JOIN users u ON o.user_id = u.id
            ORDER BY o.created_at DESC
            LIMIT 10
        `);
        
        res.json({
            success: true,
            data: {
                stats: stats[0],
                recent_orders: recentOrders
            }
        });
    } catch (error) {
        console.error('Order stats error:', error);
        res.status(500).json({ message: 'Failed to fetch stats' });
    }
};
/// Add these functions if they don't exist:

// Get orders by status (pending, processing, shipped, delivered)
exports.getOrdersByStatus = async (req, res) => {
    try {
        const { status } = req.params;
        const [orders] = await pool.query(
            `SELECT o.*, u.name as user_name, u.email as user_email, u.phone as user_phone
             FROM orders o
             JOIN users u ON o.user_id = u.id
             WHERE o.status = ?
             ORDER BY o.created_at DESC`,
            [status]
        );
        res.json({ success: true, data: orders });
    } catch (error) {
        console.error('Get orders by status error:', error);
        res.status(500).json({ message: 'Failed to fetch orders' });
    }
};

// Get all orders for admin
exports.getAllOrdersForAdmin = async (req, res) => {
    try {
        const [orders] = await pool.query(
            `SELECT o.*, u.name as user_name, u.email as user_email, u.phone as user_phone
             FROM orders o
             JOIN users u ON o.user_id = u.id
             ORDER BY o.created_at DESC`
        );
        res.json({ success: true, data: orders });
    } catch (error) {
        console.error('Get all orders error:', error);
        res.status(500).json({ message: 'Failed to fetch orders' });
    }
};

// Get pending orders (alias for status = 'pending' and 'processing')
exports.getPendingOrders = async (req, res) => {
    try {
        const [orders] = await pool.query(
            `SELECT o.*, u.name as user_name, u.email as user_email, u.phone as user_phone
             FROM orders o
             JOIN users u ON o.user_id = u.id
             WHERE o.status IN ('pending', 'processing')
             ORDER BY o.created_at ASC`
        );
        res.json({ success: true, data: orders });
    } catch (error) {
        console.error('Get pending orders error:', error);
        res.status(500).json({ message: 'Failed to fetch pending orders' });
    }
};

// Get admin statistics (total orders, revenue, etc.)
exports.getAdminStats = async (req, res) => {
    try {
        const [stats] = await pool.query(`
            SELECT 
                COUNT(*) as total_orders,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
                SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing_orders,
                SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) as shipped_orders,
                SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders,
                SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
                SUM(CASE WHEN payment_status = 'paid' THEN total ELSE 0 END) as total_revenue,
                COALESCE(ROUND(AVG(total), 2), 0) as average_order_value
            FROM orders
        `);
        const [recentOrders] = await pool.query(`
            SELECT o.*, u.name as user_name
            FROM orders o
            JOIN users u ON o.user_id = u.id
            ORDER BY o.created_at DESC
            LIMIT 10
        `);
        res.json({
            success: true,
            data: {
                stats: stats[0],
                recent_orders: recentOrders
            }
        });
    } catch (error) {
        console.error('Get admin stats error:', error);
        res.status(500).json({ message: 'Failed to fetch statistics' });
    }
};