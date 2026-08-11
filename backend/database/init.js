const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function init() {
const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true  // ⚠️ importante para ejecutar todo el SQL de una
});

const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
await conn.query(sql);

console.log('✅ Base de datos "sistema_practica" creada desde cero');
await conn.end();
}

init().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });