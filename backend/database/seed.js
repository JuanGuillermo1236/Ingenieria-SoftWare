const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Usuarios a crear con contraseñas legibles para probar
const SEED_USERS = [
  // 1 Admin
{ nombre: 'Administrador Principal', email: 'admin@sistema.com',    password: 'admin123',      rol: 'admin' },

  // 2 Docentes
{ nombre: 'María González',          email: 'maria.gonzalez@sistema.com', password: 'docente123', rol: 'docente' },
{ nombre: 'Carlos Ramírez',          email: 'carlos.ramirez@sistema.com', password: 'docente123', rol: 'docente' },

  // 4 Estudiantes
{ nombre: 'Ana López',               email: 'ana.lopez@sistema.com',      password: 'estudiante123', rol: 'estudiante' },
{ nombre: 'Luis Martínez',           email: 'luis.martinez@sistema.com',  password: 'estudiante123', rol: 'estudiante' },
{ nombre: 'Sofía Torres',            email: 'sofia.torres@sistema.com',   password: 'estudiante123', rol: 'estudiante' },
{ nombre: 'Diego Pérez',             email: 'diego.perez@sistema.com',    password: 'estudiante123', rol: 'estudiante' },
];

async function seed() {
const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sistema_practica',
});

console.log('🗑️  Limpiando usuarios demo antiguos con hashes placeholder...');
await conn.query(`DELETE FROM expediente_historial WHERE usuario_id IN (SELECT id FROM usuarios WHERE email LIKE '%@demo.com')`);
await conn.query(`DELETE FROM expedientes WHERE estudiante_id IN (SELECT id FROM usuarios WHERE email LIKE '%@demo.com')`);
await conn.query(`DELETE FROM usuarios WHERE email LIKE '%@demo.com'`);

console.log('🌱  Insertando usuarios de prueba con contraseñas reales...\n');

for (const u of SEED_USERS) {
    const password_hash = await bcrypt.hash(u.password, 10);

    // INSERT idempotente: si el email ya existe, lo ignora
    const [result] = await conn.query(
    `INSERT IGNORE INTO usuarios (nombre, email, password_hash, rol)
    VALUES (?, ?, ?, ?)`,
    [u.nombre, u.email, password_hash, u.rol]
    );

    if (result.affectedRows > 0) {
    console.log(`  ✅ ${u.rol.padEnd(12)} | ${u.email.padEnd(35)} | password: ${u.password}`);
    } else {
    console.log(`  ⏭️  ${u.rol.padEnd(12)} | ${u.email.padEnd(35)} | (ya existe)`);
    }
}

console.log('\n📋 Resumen final:');
const [rows] = await conn.query(
    `SELECT rol, COUNT(*) AS total FROM usuarios WHERE activo = TRUE GROUP BY rol`
);
console.table(rows);

console.log('\n✅ Seed completado. Usa estas cuentas para probar login.');
await conn.end();
}

seed().catch(e => {
console.error('❌ Error en seed:', e.message);
process.exit(1);
});