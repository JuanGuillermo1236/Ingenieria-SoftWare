const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

// Representa un archivo subido (ej. el documento de subsanación del estudiante).
const Documento = sequelize.define(
  "Documento",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombreOriginal: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    nombreArchivo: {
      type: DataTypes.STRING, // nombre real guardado en /uploads
      allowNull: false,
    },
    tipo: {
      type: DataTypes.STRING, // ej: "subsanacion"
      allowNull: false,
      defaultValue: "subsanacion",
    },
  },
  {
    tableName: "documentos",
    timestamps: true,
  }
);

module.exports = Documento;
