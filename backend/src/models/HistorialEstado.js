const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

// Cada cambio de estado del expediente queda registrado aquí.
// Esto es lo que alimenta la "línea de tiempo" (stepper) del Reto A.
const HistorialEstado = sequelize.define(
  "HistorialEstado",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    estadoAnterior: {
      type: DataTypes.STRING,
      allowNull: true, // null cuando es el primer registro (creación del expediente)
    },
    estadoNuevo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "historial_estados",
    timestamps: true, // usamos createdAt como la fecha del cambio
  }
);

module.exports = HistorialEstado;
