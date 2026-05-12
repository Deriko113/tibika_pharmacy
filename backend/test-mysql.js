const mysql = require('mysql2/promise');

async function testConnection() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'tibika_user',
            password: '@Tibika123',
            database: 'tibika_pharmacy'
        });
        
        console.log('✅ Connected to MySQL successfully!');
        
        const [rows] = await connection.query('SELECT 1+1 AS result');
        console.log('✅ Test query result:', rows);
        
        await connection.end();
        console.log('✅ Connection closed');
        
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
    }
}

testConnection();