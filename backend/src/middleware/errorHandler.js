// Middleware centralizado: cualquier error que llegue con next(error)
// termina aquí, para no repetir try/catch con formato distinto en cada ruta.
function manejadorDeErrores(error, req, res, next) {
  console.error("Error no controlado:", error);

  if (error.name === "SequelizeValidationError" || error.name === "SequelizeUniqueConstraintError") {
    return res.status(400).json({
      error: "Datos inválidos.",
      detalles: error.errors ? error.errors.map((e) => e.message) : undefined,
    });
  }

  res.status(500).json({ error: "Ocurrió un error interno en el servidor." });
}

module.exports = manejadorDeErrores;
