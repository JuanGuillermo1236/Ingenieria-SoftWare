const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

// Cada dictamen docente queda registrado para conservar todas las rondas de revisión.
const Observacion = sequelize.define(
  "Observacion",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    tipo: {
      type: DataTypes.ENUM("aprobado", "observado", "rechazado"),
      allowNull: false,
    },
    nota: {
      type: DataTypes.FLOAT,
      allowNull: true, // solo aplica si tipo === "aprobado"
    },
    detalle: {
      type: DataTypes.TEXT,
      allowNull: true, // obligatorio para observado/rechazado desde el controlador
    },
  },
  {
    tableName: "observaciones",
    timestamps: true,
  }
);

module.exports = Observacion;
