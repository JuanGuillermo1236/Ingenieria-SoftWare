const fs = require("fs");
const { Expediente, Usuario, Observacion, Documento, HistorialEstado, sequelize } = require("../models");
const { sumarDiasHabiles, diasHabilesRestantes, formatoFecha } = require("../utils/fechas");

const DIAS_PLAZO_EVALUACION = parseInt(process.env.DIAS_PLAZO_EVALUACION || "15", 10);
const DIAS_PLAZO_SUBSANACION = parseInt(process.env.DIAS_PLAZO_SUBSANACION || "5", 10);

const incluirRelacionesBasicas = [
  { model: Usuario, as: "estudiante", attributes: ["id", "nombre", "correo"] },
  { model: Usuario, as: "docente", attributes: ["id", "nombre", "correo"] },
];

function formatearExpedienteResumen(exp) {
  const diasRestantes = diasHabilesRestantes(exp.fechaLimite);
  return {
    id: exp.id,
    codigo: exp.codigo,
    tema: exp.tema,
    estado: exp.estado,
    fechaEntrega: exp.fechaEntrega,
    fechaLimite: exp.fechaLimite,
    diasRestantes,
    estudiante: exp.estudiante ? { id: exp.estudiante.id, nombre: exp.estudiante.nombre } : null,
    docente: exp.docente ? { id: exp.docente.id, nombre: exp.docente.nombre } : null,
  };
}

function verificarPermisoSobreExpediente(usuario, expediente) {
  const tienePermiso =
    (usuario.rol === "estudiante" && expediente.estudianteId === usuario.id) ||
    (usuario.rol === "docente" && expediente.docenteId === usuario.id) ||
    usuario.rol === "admin";

  if (!tienePermiso) {
    const error = new Error("No tienes permiso para ver este expediente.");
    error.codigoHttp = 403;
    throw error;
  }
}

function borrarArchivoSubidoSiExiste(req) {
  if (!req.file || !req.file.path) return;
  try {
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
  } catch (_) {
    // No interrumpimos la respuesta si la limpieza del archivo temporal falla.
  }
}

// ---------------------------------------------------------
// GET /api/expedientes
// Filtra automáticamente según el rol autenticado.
// ---------------------------------------------------------
async function listar(req, res, next) {
  try {
    const { id: usuarioId, rol } = req.usuario;

    let filtro = {};
    if (rol === "estudiante") filtro = { estudianteId: usuarioId };
    if (rol === "docente") filtro = { docenteId: usuarioId };

    const expedientes = await Expediente.findAll({
      where: filtro,
      include: incluirRelacionesBasicas,
      order: [["fechaLimite", "ASC"]],
    });

    res.json(expedientes.map(formatearExpedienteResumen));
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------
// GET /api/expedientes/:id
// Detalle completo para estudiante, docente asignado o admin.
// ---------------------------------------------------------
async function obtenerDetalle(req, res, next) {
  try {
    const expediente = await Expediente.findByPk(req.params.id, {
      include: [
        ...incluirRelacionesBasicas,
        { model: HistorialEstado, as: "historial" },
        {
          model: Observacion,
          as: "observaciones",
          include: [{ model: Usuario, as: "autor", attributes: ["id", "nombre"] }],
        },
        {
          model: Documento,
          as: "documentos",
          include: [{ model: Usuario, as: "subidoPor", attributes: ["id", "nombre"] }],
        },
      ],
      order: [
        [{ model: HistorialEstado, as: "historial" }, "createdAt", "ASC"],
        [{ model: Observacion, as: "observaciones" }, "createdAt", "DESC"],
        [{ model: Documento, as: "documentos" }, "createdAt", "DESC"],
      ],
    });

    if (!expediente) {
      return res.status(404).json({ error: "Expediente no encontrado." });
    }

    verificarPermisoSobreExpediente(req.usuario, expediente);

    res.json({
      ...formatearExpedienteResumen(expediente),
      historial: expediente.historial,
      observaciones: expediente.observaciones,
      documentos: expediente.documentos,
    });
  } catch (error) {
    if (error.codigoHttp) {
      return res.status(error.codigoHttp).json({ error: error.message });
    }
    next(error);
  }
}

// ---------------------------------------------------------
// POST /api/expedientes (solo admin)
// ---------------------------------------------------------
async function crear(req, res, next) {
  const t = await sequelize.transaction();
  try {
    const { codigo, tema, estudianteId, docenteId, fechaEntrega } = req.body;

    if (!codigo || !tema || !estudianteId || !fechaEntrega) {
      await t.rollback();
      return res.status(400).json({ error: "codigo, tema, estudianteId y fechaEntrega son obligatorios." });
    }

    const estudiante = await Usuario.findOne({
      where: { id: estudianteId, rol: "estudiante" },
      transaction: t,
    });
    if (!estudiante) {
      await t.rollback();
      return res.status(400).json({ error: "El estudianteId indicado no corresponde a un estudiante válido." });
    }

    if (docenteId) {
      const docente = await Usuario.findOne({
        where: { id: docenteId, rol: "docente" },
        transaction: t,
      });
      if (!docente) {
        await t.rollback();
        return res.status(400).json({ error: "El docenteId indicado no corresponde a un docente válido." });
      }
    }

    const fechaLimite = formatoFecha(sumarDiasHabiles(fechaEntrega, DIAS_PLAZO_EVALUACION));
    const estadoInicial = docenteId ? "en_comision" : "entregado";

    const expediente = await Expediente.create(
      {
        codigo: codigo.trim(),
        tema: tema.trim(),
        estudianteId,
        docenteId: docenteId || null,
        fechaEntrega,
        fechaLimite,
        estado: estadoInicial,
      },
      { transaction: t }
    );

    await HistorialEstado.create(
      {
        expedienteId: expediente.id,
        estadoAnterior: null,
        estadoNuevo: "entregado",
        cambiadoPorId: req.usuario.id,
      },
      { transaction: t }
    );

    if (estadoInicial === "en_comision") {
      await HistorialEstado.create(
        {
          expedienteId: expediente.id,
          estadoAnterior: "entregado",
          estadoNuevo: "en_comision",
          cambiadoPorId: req.usuario.id,
        },
        { transaction: t }
      );
    }

    await t.commit();
    res.status(201).json(expediente);
  } catch (error) {
    await t.rollback();
    next(error);
  }
}

// ---------------------------------------------------------
// PATCH /api/expedientes/:id/asignar-docente (solo admin)
// Registra también la transición en el historial.
// ---------------------------------------------------------
async function asignarDocente(req, res, next) {
  const t = await sequelize.transaction();
  try {
    const { docenteId } = req.body;
    const expediente = await Expediente.findByPk(req.params.id, { transaction: t });

    if (!expediente) {
      await t.rollback();
      return res.status(404).json({ error: "Expediente no encontrado." });
    }

    const docente = await Usuario.findOne({
      where: { id: docenteId, rol: "docente" },
      transaction: t,
    });
    if (!docente) {
      await t.rollback();
      return res.status(400).json({ error: "El docenteId indicado no corresponde a un docente válido." });
    }

    const estadoAnterior = expediente.estado;
    expediente.docenteId = docenteId;

    if (expediente.estado === "entregado") {
      expediente.estado = "en_comision";
      expediente.fechaLimite = formatoFecha(sumarDiasHabiles(new Date(), DIAS_PLAZO_EVALUACION));
    }

    await expediente.save({ transaction: t });

    if (estadoAnterior !== expediente.estado) {
      await HistorialEstado.create(
        {
          expedienteId: expediente.id,
          estadoAnterior,
          estadoNuevo: expediente.estado,
          cambiadoPorId: req.usuario.id,
        },
        { transaction: t }
      );
    }

    await t.commit();
    res.json(expediente);
  } catch (error) {
    await t.rollback();
    next(error);
  }
}

// ---------------------------------------------------------
// POST /api/expedientes/:id/dictamen
// Decisiones: aprobado | observado | rechazado
// ---------------------------------------------------------
async function dictaminar(req, res, next) {
  const t = await sequelize.transaction();
  try {
    const { tipo, nota, detalle } = req.body;

    const expediente = await Expediente.findByPk(req.params.id, { transaction: t });
    if (!expediente) {
      await t.rollback();
      return res.status(404).json({ error: "Expediente no encontrado." });
    }

    if (expediente.docenteId !== req.usuario.id && req.usuario.rol !== "admin") {
      await t.rollback();
      return res.status(403).json({ error: "Solo el docente asignado puede dictaminar este expediente." });
    }

    if (expediente.estado !== "en_comision") {
      await t.rollback();
      return res.status(409).json({
        error: "Este expediente no está pendiente de revisión. Solo se puede dictaminar cuando está En comisión.",
      });
    }

    if (!["aprobado", "observado", "rechazado"].includes(tipo)) {
      await t.rollback();
      return res.status(400).json({ error: 'tipo debe ser "aprobado", "observado" o "rechazado".' });
    }

    if (tipo === "aprobado") {
      const notaNumero = Number(nota);
      if (!Number.isFinite(notaNumero) || notaNumero < 0 || notaNumero > 20) {
        await t.rollback();
        return res.status(400).json({ error: "Debes indicar una nota válida entre 0 y 20." });
      }
    } else if (!detalle || !detalle.trim()) {
      await t.rollback();
      return res.status(400).json({
        error:
          tipo === "observado"
            ? "Debes describir las correcciones que debe realizar el estudiante."
            : "Debes indicar el motivo del rechazo.",
      });
    }

    await Observacion.create(
      {
        expedienteId: expediente.id,
        autorId: req.usuario.id,
        tipo,
        nota: tipo === "aprobado" ? Number(nota) : null,
        detalle: tipo === "aprobado" ? null : detalle.trim(),
      },
      { transaction: t }
    );

    const estadoAnterior = expediente.estado;
    expediente.estado = tipo;

    if (tipo === "observado") {
      expediente.fechaLimite = formatoFecha(sumarDiasHabiles(new Date(), DIAS_PLAZO_SUBSANACION));
    }

    await expediente.save({ transaction: t });

    await HistorialEstado.create(
      {
        expedienteId: expediente.id,
        estadoAnterior,
        estadoNuevo: expediente.estado,
        cambiadoPorId: req.usuario.id,
      },
      { transaction: t }
    );

    await t.commit();
    res.json({
      mensaje:
        tipo === "aprobado"
          ? "Expediente aprobado correctamente."
          : tipo === "observado"
          ? "Expediente observado. El estudiante podrá subir una subsanación."
          : "Expediente rechazado correctamente.",
      estado: expediente.estado,
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
}

// ---------------------------------------------------------
// POST /api/expedientes/:id/documentos (solo estudiante dueño)
// ---------------------------------------------------------
async function subirDocumento(req, res, next) {
  const t = await sequelize.transaction();
  try {
    const expediente = await Expediente.findByPk(req.params.id, { transaction: t });

    if (!expediente) {
      borrarArchivoSubidoSiExiste(req);
      await t.rollback();
      return res.status(404).json({ error: "Expediente no encontrado." });
    }

    if (expediente.estudianteId !== req.usuario.id) {
      borrarArchivoSubidoSiExiste(req);
      await t.rollback();
      return res.status(403).json({ error: "Solo el estudiante dueño del expediente puede subir documentos." });
    }

    if (!["entregado", "en_comision", "observado"].includes(expediente.estado)) {
      borrarArchivoSubidoSiExiste(req);
      await t.rollback();
      return res.status(409).json({
        error: "El expediente ya tiene un dictamen final y no admite nuevos documentos.",
      });
    }

    if (!req.file) {
      await t.rollback();
      return res.status(400).json({ error: "No se recibió ningún archivo." });
    }

    const documento = await Documento.create(
      {
        expedienteId: expediente.id,
        subidoPorId: req.usuario.id,
        nombreOriginal: req.file.originalname,
        nombreArchivo: req.file.filename,
        tipo: expediente.estado === "observado" ? "subsanacion" : "documento",
      },
      { transaction: t }
    );

    if (expediente.estado === "observado") {
      const estadoAnterior = expediente.estado;
      expediente.estado = "en_comision";
      expediente.fechaLimite = formatoFecha(sumarDiasHabiles(new Date(), DIAS_PLAZO_EVALUACION));
      await expediente.save({ transaction: t });

      await HistorialEstado.create(
        {
          expedienteId: expediente.id,
          estadoAnterior,
          estadoNuevo: expediente.estado,
          cambiadoPorId: req.usuario.id,
        },
        { transaction: t }
      );
    }

    await t.commit();
    res.status(201).json({
      mensaje: "Documento subido correctamente.",
      documento,
      estadoExpediente: expediente.estado,
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
}

module.exports = {
  listar,
  obtenerDetalle,
  crear,
  asignarDocente,
  dictaminar,
  subirDocumento,
};
