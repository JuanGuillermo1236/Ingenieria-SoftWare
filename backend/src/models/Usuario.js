const bcrypt = require('bcryptjs');
const db = require('../config/db'); // tu conexión mysql2 (la misma del backend)

class Usuario {
  // Crear un nuevo usuario (hashea el password automáticamente)
  static async create({ nombre, email, password, rol = 'estudiante' }) {
    const password_hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol)
      VALUES (?, ?, ?, ?)`,
      [nombre, email, password_hash, rol]
    );
    return { id: result.insertId, nombre, email, rol };
  }

  // Buscar por email
  static async findByEmail(email) {
    const [rows] = await db.query(
      `SELECT * FROM usuarios WHERE email = ? AND activo = TRUE`,
      [email]
    );
    return rows[0] || null;
  }

  // Buscar por ID
  static async findById(id) {
    const [rows] = await db.query(
      `SELECT * FROM usuarios WHERE id = ? AND activo = TRUE`,
      [id]
    );
    return rows[0] || null;
  }

  // Listar por rol
  static async listByRol(rol) {
    const [rows] = await db.query(
      `SELECT id, nombre, email, rol, creado_en FROM usuarios WHERE rol = ? AND activo = TRUE`,
      [rol]
    );
    return rows;
  }

  // Listar todos
  static async listAll() {
    const [rows] = await db.query(
      `SELECT id, nombre, email, rol, creado_en FROM usuarios WHERE activo = TRUE`
    );
    return rows;
  }

  // Verificar contraseña (para login)
  static async comparePassword(plainPassword, hash) {
    return bcrypt.compare(plainPassword, hash);
  }

  // Registrar último acceso
  static async updateLastAccess(id) {
    await db.query(
      `UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?`,
      [id]
    );
  }

  // Desactivar (soft delete)
  static async deactivate(id) {
    await db.query(`UPDATE usuarios SET activo = FALSE WHERE id = ?`, [id]);
  }
}

module.exports = Usuario;