const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const env = require('./getEnv');

dotenv.config();

const pool = mysql.createPool({
    host: env().DB_HOST,
    port: env().DB_PORT,
    user: env().DB_USER,
    password: env().DB_PASSWORD,
    database: env().DB_NAME,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,

    ssl: {
        rejectUnauthorized: false
    },

    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

const initDatabase = async () => {
    let connection;
    try {
        connection = await pool.getConnection();
        
        console.log('✅ Connected to MySQL database');
        
        // Users table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role ENUM('patient', 'pharmacist', 'admin') DEFAULT 'patient',
                phone VARCHAR(20) NOT NULL,
                street VARCHAR(255),
                city VARCHAR(100),
                state VARCHAR(100),
                county VARCHAR(100),
                estate VARCHAR(255),
                zip_code VARCHAR(20),
                country VARCHAR(100) DEFAULT 'Kenya',
                profile_image TEXT,
                is_verified BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_email (email),
                INDEX idx_role (role)
            )
        `);
        console.log('✅ Users table ready');

        // Add county and estate columns if they don't exist (for existing tables)
        try {
            await connection.query(`ALTER TABLE users ADD COLUMN county VARCHAR(100)`);
            console.log('✅ Added county column to users');
        } catch (err) {
            if (!err.message.includes('Duplicate column')) {
                console.log('County column already exists or error:', err.message);
            }
        }
        
        try {
            await connection.query(`ALTER TABLE users ADD COLUMN estate VARCHAR(255)`);
            console.log('✅ Added estate column to users');
        } catch (err) {
            if (!err.message.includes('Duplicate column')) {
                console.log('Estate column already exists or error:', err.message);
            }
        }

        // Medications table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS medications (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255) NOT NULL,
                generic_name VARCHAR(255),
                category VARCHAR(100),
                manufacturer VARCHAR(255),
                requires_prescription BOOLEAN DEFAULT TRUE,
                price DECIMAL(10, 2) NOT NULL,
                stock_quantity INT DEFAULT 0,
                unit VARCHAR(50),
                dosage_form VARCHAR(100),
                strength VARCHAR(100),
                description TEXT,
                image_url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_name (name),
                INDEX idx_category (category)
            )
        `);
        console.log('✅ Medications table ready');

        // Prescriptions table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS prescriptions (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                image_url TEXT NOT NULL,
                ocr_text TEXT,
                status ENUM('pending', 'reviewing', 'approved', 'rejected', 'dispensed') DEFAULT 'pending',
                pharmacist_notes TEXT,
                pharmacist_id INT,
                rejection_reason TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                reviewed_at TIMESTAMP NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (pharmacist_id) REFERENCES users(id),
                INDEX idx_user_id (user_id),
                INDEX idx_status (status)
            )
        `);
        console.log('✅ Prescriptions table ready');

        // Orders table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id INT PRIMARY KEY AUTO_INCREMENT,
                order_number VARCHAR(50) UNIQUE NOT NULL,
                user_id INT NOT NULL,
                prescription_id INT NULL,
                subtotal DECIMAL(10, 2) NOT NULL,
                tax DECIMAL(10, 2) DEFAULT 0,
                delivery_fee DECIMAL(10, 2) DEFAULT 0,
                total DECIMAL(10, 2) NOT NULL,
                status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
                payment_method ENUM('mpesa', 'card', 'cash_on_delivery') NOT NULL,
                payment_status ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
                shipping_street VARCHAR(255),
                shipping_city VARCHAR(100),
                shipping_state VARCHAR(100),
                shipping_county VARCHAR(100),
                shipping_estate VARCHAR(255),
                shipping_zip_code VARCHAR(20),
                shipping_country VARCHAR(100),
                mpesa_number VARCHAR(20),
                tracking_number VARCHAR(100),
                estimated_delivery DATE,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                INDEX idx_user_id (user_id),
                INDEX idx_status (status),
                INDEX idx_order_number (order_number)
            )
        `);
        console.log('✅ Orders table ready');

        // Add Kenya-specific columns to orders if they don't exist
        try {
            await connection.query(`ALTER TABLE orders ADD COLUMN shipping_county VARCHAR(100)`);
            console.log('✅ Added shipping_county column to orders');
        } catch (err) {
            if (!err.message.includes('Duplicate column')) {
                console.log('shipping_county column already exists');
            }
        }
        
        try {
            await connection.query(`ALTER TABLE orders ADD COLUMN shipping_estate VARCHAR(255)`);
            console.log('✅ Added shipping_estate column to orders');
        } catch (err) {
            if (!err.message.includes('Duplicate column')) {
                console.log('shipping_estate column already exists');
            }
        }
        
        try {
            await connection.query(`ALTER TABLE orders ADD COLUMN mpesa_number VARCHAR(20)`);
            console.log('✅ Added mpesa_number column to orders');
        } catch (err) {
            if (!err.message.includes('Duplicate column')) {
                console.log('mpesa_number column already exists');
            }
        }

        // Order items table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS order_items (
                id INT PRIMARY KEY AUTO_INCREMENT,
                order_id INT NOT NULL,
                medication_id INT,
                medication_name VARCHAR(255) NOT NULL,
                quantity INT NOT NULL,
                price DECIMAL(10, 2) NOT NULL,
                requires_prescription BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
                INDEX idx_order_id (order_id)
            )
        `);
        console.log('✅ Order items table ready');

        // Cart table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS cart (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                medication_id INT NOT NULL,
                quantity INT NOT NULL,
                added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (medication_id) REFERENCES medications(id),
                UNIQUE KEY unique_cart_item (user_id, medication_id),
                INDEX idx_user_id (user_id)
            )
        `);
        console.log('✅ Cart table ready');

        // Insert sample medications if table is empty
        const [medCount] = await connection.query('SELECT COUNT(*) as count FROM medications');
        if (medCount[0].count === 0) {
            await connection.query(`
          INSERT INTO medications (name, generic_name, category, manufacturer, requires_prescription, price, stock_quantity, unit, dosage_form, strength, description, image_url) VALUES
        ('Amoxicillin', 'Amoxicillin', 'antibiotic', 'GSK', true, 350.00, 500, 'capsule', 'capsule', '500mg', 'Antibiotic for bacterial infections', '/images/amoxicillin.jpg'),
        ('Ibuprofen', 'Ibuprofen', 'painkiller', 'Pfizer', false, 250.00, 1000, 'tablet', 'tablet', '200mg', 'Pain reliever for headaches and fever', '/images/ibuprofen.jpg'),
        ('Paracetamol', 'Paracetamol', 'painkiller', 'Generic', false, 100.00, 2000, 'tablet', 'tablet', '500mg', 'Fever and pain relief', '/images/paracetamol.jpg'),
        ('Malaria Kit (ACT)', 'Artemether/Lumefantrine', 'antimalarial', 'Novartis', true, 850.00, 300, 'tablet', 'tablet', '20/120mg', 'First-line malaria treatment', '/images/malaria-kit.jpg'),
        ('Vitamin C', 'Ascorbic Acid', 'vitamin', 'Generic', false, 150.00, 500, 'tablet', 'tablet', '500mg', 'Immune system support', '/images/vitamin-c.jpg'),
        ('Cetirizine', 'Cetirizine', 'antihistamine', 'Johnson & Johnson', false, 180.00, 400, 'tablet', 'tablet', '10mg', 'Antihistamine for allergies', '/images/cetirizine.jpg'),
        ('Omeprazole', 'Omeprazole', 'other', 'AstraZeneca', false, 220.00, 250, 'capsule', 'capsule', '20mg', 'Proton pump inhibitor for acid reflux', '/images/omeprazole.jpg'),
        ('Zithromax', 'Azithromycin', 'antibiotic', 'Pfizer', true, 1200.00, 200, 'tablet', 'tablet', '500mg', 'Macrolide antibiotic', '/images/zithromax.jpg'),
        ('Flagyl', 'Metronidazole', 'antibiotic', 'Sanofi', true, 280.00, 500, 'tablet', 'tablet', '400mg', 'Antibiotic for bacterial infections', '/images/flagyl.jpg'),
        ('Piriton', 'Chlorpheniramine', 'antihistamine', 'GSK', false, 150.00, 800, 'tablet', 'tablet', '4mg', 'Antihistamine for allergies', '/images/piriton.jpg')      
            `);
            console.log('✅ Sample medications inserted (Kenyan prices in KES)');
        }

        console.log('🎉 Database initialization complete!');
        
    } catch (error) {
        console.error('❌ Database initialization error:', error);
        throw error;
    } finally {
        if (connection) connection.release();
    }
};

module.exports = { pool, initDatabase };