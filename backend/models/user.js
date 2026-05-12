const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
    static async create(userData) {
        const { name, email, password, phone, role = 'patient', street, city, state, zip_code, country } = userData;
        const hashedPassword = await bcrypt.hash(password, 12);
        
        const [result] = await pool.query(
            `INSERT INTO users (name, email, password, phone, role, street, city, state, zip_code, country) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, email, hashedPassword, phone, role, street, city, state, zip_code, country]
        );
        
        return this.findById(result.insertId);
    }

    static async findByEmail(email) {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];
    }

    static async findById(id) {
        const [rows] = await pool.query(
            `SELECT id, name, email, role, phone, street, city, state, zip_code, country, 
                    profile_image, is_verified, created_at 
             FROM users WHERE id = ?`,
            [id]
        );
        return rows[0];
    }

    static async findByIdWithPassword(id) {
        const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
        return rows[0];
    }

    static async update(id, updateData) {
        const fields = [];
        const values = [];
        
        for (const [key, value] of Object.entries(updateData)) {
            fields.push(`${key} = ?`);
            values.push(value);
        }
        values.push(id);
        
        await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
        return this.findById(id);
    }

    static async comparePassword(candidatePassword, hashedPassword) {
        return await bcrypt.compare(candidatePassword, hashedPassword);
    }
}

module.exports = User;