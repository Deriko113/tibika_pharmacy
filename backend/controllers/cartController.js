const { pool } = require('../config/database');

exports.getCart = async (req, res) => {
    try {
        const [items] = await pool.query(
            `SELECT c.id as cart_id, c.quantity, 
                    m.id as medication_id, m.name, m.price, m.image_url, 
                    m.requires_prescription, m.stock_quantity, m.unit
             FROM cart c
             JOIN medications m ON c.medication_id = m.id
             WHERE c.user_id = ?`,
            [req.user.id]
        );
        
        // Calculate totals - ensure price is treated as number
        let subtotal = 0;
        const formattedItems = items.map(item => {
            const price = parseFloat(item.price) || 0;
            const quantity = parseInt(item.quantity) || 0;
            const itemTotal = price * quantity;
            subtotal += itemTotal;
            
            return {
                ...item,
                price: price,
                quantity: quantity,
                item_total: itemTotal,
                price_formatted: `KES ${price.toFixed(2)}`,
                item_total_formatted: `KES ${itemTotal.toFixed(2)}`
            };
        });
        
        const taxRate = 0.16; // 16% VAT
        const tax = subtotal * taxRate;
        const deliveryFee = 200; // Default delivery fee
        const total = subtotal + tax + deliveryFee;
        
        res.json({
            success: true,
            data: {
                items: formattedItems,
                subtotal: subtotal,
                subtotal_formatted: `KES ${subtotal.toFixed(2)}`,
                tax: tax,
                tax_formatted: `KES ${tax.toFixed(2)}`,
                delivery_fee: deliveryFee,
                delivery_fee_formatted: `KES ${deliveryFee.toFixed(2)}`,
                total: total,
                total_formatted: `KES ${total.toFixed(2)}`,
                item_count: formattedItems.length,
                currency: 'KES'
            }
        });
    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error loading cart: ' + error.message,
            data: { items: [], subtotal: 0, tax: 0, delivery_fee: 0, total: 0 }
        });
    }
};

exports.addToCart = async (req, res) => {
    try {
        const { medication_id, quantity = 1 } = req.body;
        
        // Check if medication exists and get price
        const [medication] = await pool.query(
            'SELECT id, stock_quantity, price, name FROM medications WHERE id = ?',
            [medication_id]
        );
        
        if (medication.length === 0) {
            return res.status(404).json({ success: false, message: 'Medication not found' });
        }
        
        if (medication[0].stock_quantity < quantity) {
            return res.status(400).json({ success: false, message: 'Insufficient stock' });
        }
        
        // Check if already in cart
        const [existing] = await pool.query(
            'SELECT id, quantity FROM cart WHERE user_id = ? AND medication_id = ?',
            [req.user.id, medication_id]
        );
        
        if (existing.length > 0) {
            // Update quantity
            const newQuantity = existing[0].quantity + quantity;
            await pool.query(
                'UPDATE cart SET quantity = ? WHERE id = ?',
                [newQuantity, existing[0].id]
            );
        } else {
            // Add new item
            await pool.query(
                'INSERT INTO cart (user_id, medication_id, quantity) VALUES (?, ?, ?)',
                [req.user.id, medication_id, quantity]
            );
        }
        
        res.json({ 
            success: true, 
            message: `${medication[0].name} added to cart`,
            data: { medication_id, quantity }
        });
    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({ success: false, message: 'Failed to add to cart: ' + error.message });
    }
};

exports.updateCartItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;
        
        if (quantity <= 0) {
            await pool.query('DELETE FROM cart WHERE id = ? AND user_id = ?', [id, req.user.id]);
        } else {
            await pool.query('UPDATE cart SET quantity = ? WHERE id = ? AND user_id = ?', [quantity, id, req.user.id]);
        }
        
        res.json({ success: true, message: 'Cart updated' });
    } catch (error) {
        console.error('Update cart error:', error);
        res.status(500).json({ success: false, message: 'Failed to update cart' });
    }
};

exports.removeFromCart = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM cart WHERE id = ? AND user_id = ?', [id, req.user.id]);
        
        res.json({ success: true, message: 'Item removed from cart' });
    } catch (error) {
        console.error('Remove from cart error:', error);
        res.status(500).json({ success: false, message: 'Failed to remove item' });
    }
};

exports.clearCart = async (req, res) => {
    try {
        await pool.query('DELETE FROM cart WHERE user_id = ?', [req.user.id]);
        res.json({ success: true, message: 'Cart cleared' });
    } catch (error) {
        console.error('Clear cart error:', error);
        res.status(500).json({ success: false, message: 'Failed to clear cart' });
    }
};