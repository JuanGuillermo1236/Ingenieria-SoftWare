// =========================================================
// Relaciones entre tablas (asociaciones de Sequelize)
// =========================================================
//
//  Usuario (estudiante) 1 --- N Expediente
//  Usuario (docente)    1 --- N Expediente
//  Expediente           1 --- N Observacion
//  Expediente           1 --- N Documento
//  Expediente           1 --- N HistorialEstado
//
// =========================================================

const sequelize = require("../config/database");
const Usuario = require("./Usuario");
const Expediente = require("./Expediente");
const Observacion = require("./Observacion");
const Documento = require("./Documento");
const HistorialEstado = require("./HistorialEstado");

// ---- Expediente pertenece a un estudiante y (opcionalmente) a un docente ----
Usuario.hasMany(Expediente, { as: "expedientesComoEstudiante", foreignKey: "estudianteId" });
Expediente.belongsTo(Usuario, { as: "estudiante", foreignKey: "estudianteId" });

Usuario.hasMany(Expediente, { as: "expedientesComoDocente", foreignKey: "docenteId" });
Expediente.belongsTo(Usuario, { as: "docente", foreignKey: "docenteId" });

// ---- Observaciones (dictámenes) ----
Expediente.hasMany(Observacion, { as: "observaciones", foreignKey: "expedienteId" });
Observacion.belongsTo(Expediente, { foreignKey: "expedienteId" });

Usuario.hasMany(Observacion, { as: "observacionesEmitidas", foreignKey: "autorId" });
Observacion.belongsTo(Usuario, { as: "autor", foreignKey: "autorId" });

// ---- Documentos subidos ----
Expediente.hasMany(Documento, { as: "documentos", foreignKey: "expedienteId" });
Documento.belongsTo(Expediente, { foreignKey: "expedienteId" });

Usuario.hasMany(Documento, { as: "documentosSubidos", foreignKey: "subidoPorId" });
Documento.belongsTo(Usuario, { as: "subidoPor", foreignKey: "subidoPorId" });

// ---- Historial de estados (trazabilidad) ----
Expediente.hasMany(HistorialEstado, { as: "historial", foreignKey: "expedienteId" });
HistorialEstado.belongsTo(Expediente, { foreignKey: "expedienteId" });

Usuario.hasMany(HistorialEstado, { as: "cambiosRealizados", foreignKey: "cambiadoPorId" });
HistorialEstado.belongsTo(Usuario, { as: "cambiadoPor", foreignKey: "cambiadoPorId" });

module.exports = {
  sequelize,
  Usuario,
  Expediente,
  Observacion,
  Documento,
  HistorialEstado,
};
