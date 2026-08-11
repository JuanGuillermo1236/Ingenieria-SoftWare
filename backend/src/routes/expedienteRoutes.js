const express = require("express");
const router = express.Router();
const expedienteController = require("../controllers/expedienteController");
const { requiereAutenticacion, requiereRol } = require("../middleware/auth");
const upload = require("../middleware/upload");

// Todas las rutas de expedientes requieren estar autenticado.
router.use(requiereAutenticacion);

router.get("/", expedienteController.listar);
router.get("/:id", expedienteController.obtenerDetalle);

router.post("/", requiereRol("admin"), expedienteController.crear);
router.patch("/:id/asignar-docente", requiereRol("admin"), expedienteController.asignarDocente);

router.post("/:id/dictamen", requiereRol("docente", "admin"), expedienteController.dictaminar);

router.post(
  "/:id/documentos",
  requiereRol("estudiante"),
  upload.single("archivo"),
  expedienteController.subirDocumento
);

module.exports = router;
