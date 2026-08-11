const express = require("express");
const router = express.Router();
const usuarioController = require("../controllers/usuarioController");
const { requiereAutenticacion, requiereRol } = require("../middleware/auth");

router.use(requiereAutenticacion);

router.get("/", requiereRol("admin"), usuarioController.listar);
router.post("/", requiereRol("admin"), usuarioController.crear);

module.exports = router;
