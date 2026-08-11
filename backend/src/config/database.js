// =========================================================
// Conexión a la base de datos
// =========================================================
// Usamos SQLite porque no requiere instalar un servidor de base
// de datos aparte: todo vive en un archivo dentro de /database.
//
// IMPORTANTE PARA ESCALAR EL PROYECTO:
// Sequelize soporta varios motores (Postgres, MySQL, MariaDB, MSSQL).
// El día que este proyecto necesite crecer a producción, basta con:
//   1) npm install pg pg-hstore   (o mysql2, etc.)
//   2) cambiar "dialect" y las credenciales aquí abajo
// El resto del código (modelos, controladores) no cambia casi nada.
// =========================================================

const path = require("path");
const { Sequelize } = require("sequelize");

const rutaArchivoDB = path.join(__dirname, "..", "..", "database", "practicas.sqlite");

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: rutaArchivoDB,
  logging: false, // pon esto en console.log si quieres ver las queries SQL generadas
});

module.exports = sequelize;
