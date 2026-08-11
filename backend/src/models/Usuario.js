const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

// Roles posibles del sistema.
// estudiante -> ve y gestiona su(s) propio(s) expediente(s)
// docente    -> evalúa (dictamina) los expedientes que se le asignen
// admin      -> crea usuarios, crea expedientes y asigna docentes
const ROLES = ["estudiante", "docente", "admin"];

const Usuario = sequelize.define(
  "Usuario",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    correo: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    rol: {
      type: DataTypes.ENUM(...ROLES),
      allowNull: false,
    },
  },
  {
    tableName: "usuarios",
    timestamps: true,
  }
);

Usuario.ROLES = ROLES;

module.exports = Usuario;
