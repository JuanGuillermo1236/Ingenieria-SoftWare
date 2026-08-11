const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { requiereAutenticacion } = require("../middleware/auth");

router.post("/login", authController.login);
router.get("/me", requiereAutenticacion, authController.me);

module.exports = router;
