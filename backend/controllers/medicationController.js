const { pool } = require('../config/database');

// Get all medications (public)
exports.getAllMedications = async (req, res) => {
    try {
        const { search, category, requiresPrescription, page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        let query = 'SELECT * FROM medications WHERE 1=1';
        const params = [];
        
        if (search) {
            query += ' AND (name LIKE ? OR generic_name LIKE ? OR description LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }
        
        if (category && category !== 'all') {
            query += ' AND category = ?';
            params.push(category);
        }
        
        if (requiresPrescription === 'true') {
            query += ' AND requires_prescription = 1';
        } else if (requiresPrescription === 'false') {
            query += ' AND requires_prescription = 0';
        }
        
        // Get total count
        const [countResult] = await pool.query(
            query.replace('*', 'COUNT(*) as total'),
            params
        );
        const total = countResult[0].total;
        
        // Get paginated results
        query += ' ORDER BY name ASC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);
        
        const [medications] = await pool.query(query, params);
        
        // Send raw price numbers (no currency symbol)
        const formattedMedications = medications.map(med => ({
            ...med,
            price: parseFloat(med.price)
        }));
        
        res.json({
            success: true,
            data: formattedMedications,
            currency: 'KES',
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get medications error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get single medication by ID (public)
exports.getMedicationById = async (req, res) => {
    try {
        const { id } = req.params;
        const [medications] = await pool.query('SELECT * FROM medications WHERE id = ?', [id]);
        
        if (medications.length === 0) {
            return res.status(404).json({ message: 'Medication not found' });
        }
        
        const medication = {
            ...medications[0],
            price: parseFloat(medications[0].price)
        };
        
        res.json({ success: true, data: medication, currency: 'KES' });
    } catch (error) {
        console.error('Get medication error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get categories (public)
exports.getCategories = async (req, res) => {
    try {
        const [categories] = await pool.query(
            'SELECT DISTINCT category, COUNT(*) as count FROM medications GROUP BY category'
        );
        res.json({ success: true, data: categories });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Create new medication (admin only)
exports.createMedication = async (req, res) => {
    try {
        const {
            name, generic_name, category, manufacturer, requires_prescription,
            price, stock_quantity, unit, dosage_form, strength, description, image_url
        } = req.body;
        
        const [result] = await pool.query(
            `INSERT INTO medications (
                name, generic_name, category, manufacturer, requires_prescription,
                price, stock_quantity, unit, dosage_form, strength, description, image_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, generic_name, category, manufacturer, requires_prescription,
             price, stock_quantity, unit, dosage_form, strength, description, image_url]
        );
        
        const [newMedication] = await pool.query(
            'SELECT * FROM medications WHERE id = ?',
            [result.insertId]
        );
        
        res.status(201).json({
            success: true,
            data: newMedication[0],
            message: 'Medication created successfully'
        });
    } catch (error) {
        console.error('Create medication error:', error);
        res.status(500).json({ message: 'Failed to create medication' });
    }
};

// Update medication (admin only)
exports.updateMedication = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        const fields = [];
        const values = [];
        
        for (const [key, value] of Object.entries(updates)) {
            fields.push(`${key} = ?`);
            values.push(value);
        }
        values.push(id);
        
        await pool.query(
            `UPDATE medications SET ${fields.join(', ')} WHERE id = ?`,
            values
        );
        
        const [updated] = await pool.query(
            'SELECT * FROM medications WHERE id = ?',
            [id]
        );
        
        res.json({
            success: true,
            data: updated[0],
            message: 'Medication updated successfully'
        });
    } catch (error) {
        console.error('Update medication error:', error);
        res.status(500).json({ message: 'Failed to update medication' });
    }
};

// Delete medication (admin only)
exports.deleteMedication = async (req, res) => {
    try {
        const { id } = req.params;
        
        await pool.query('DELETE FROM medications WHERE id = ?', [id]);
        
        res.json({
            success: true,
            message: 'Medication deleted successfully'
        });
    } catch (error) {
        console.error('Delete medication error:', error);
        res.status(500).json({ message: 'Failed to delete medication' });
    }
};

// Update stock quantity (admin only)
exports.updateStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { stock_quantity } = req.body;
        
        await pool.query(
            'UPDATE medications SET stock_quantity = ? WHERE id = ?',
            [stock_quantity, id]
        );
        
        const [updated] = await pool.query(
            'SELECT * FROM medications WHERE id = ?',
            [id]
        );
        
        res.json({
            success: true,
            data: updated[0],
            message: 'Stock updated successfully'
        });
    } catch (error) {
        console.error('Update stock error:', error);
        res.status(500).json({ message: 'Failed to update stock' });
    }
};