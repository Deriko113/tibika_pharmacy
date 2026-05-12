const mysql = require('mysql2/promise');
const env = require('./config/getEnv');

async function testConnection() {
    try {
        const connection = await mysql.createConnection({
            host: env().DB_HOST,
            user: env().DB_USER,
            password: env().DB_PASSWORD,
            database: env().DB_NAME
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