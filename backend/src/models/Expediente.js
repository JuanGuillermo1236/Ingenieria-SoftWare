const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

// Flujo principal:
// entregado -> en_comision -> observado -> en_comision (tras subsanar) -> aprobado -> sustentacion
// También puede finalizar en rechazado cuando el docente determina que no corresponde subsanar.
const ESTADOS = ["entregado", "en_comision", "observado", "aprobado", "rechazado", "sustentacion"];

const Expediente = sequelize.define(
  "Expediente",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    codigo: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    tema: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    estado: {
      type: DataTypes.ENUM(...ESTADOS),
      allowNull: false,
      defaultValue: "entregado",
    },
    fechaEntrega: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    fechaLimite: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
  },
  {
    tableName: "expedientes",
    timestamps: true,
  }
);

Expediente.ESTADOS = ESTADOS;

module.exports = Expediente;
