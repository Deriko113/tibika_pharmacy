const { pool } = require('./config/database');

async function test() {
    try {
        // Check if prescriptions table exists
        const [tables] = await pool.query(
            "SHOW TABLES LIKE 'prescriptions'"
        );
        
        if (tables.length > 0) {
            console.log('✅ Prescriptions table exists');
            
            // Check table structure
            const [columns] = await pool.query("DESCRIBE prescriptions");
            console.log('📋 Table columns:', columns.map(c => c.Field).join(', '));
        } else {
            console.log('❌ Prescriptions table does not exist');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

test();