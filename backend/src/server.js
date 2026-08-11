require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const { sequelize } = require("./models");
const manejadorDeErrores = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const usuarioRoutes = require("./routes/usuarioRoutes");
const expedienteRoutes = require("./routes/expedienteRoutes");

const app = express();
const PORT = process.env.PORT || 4000;

// ---------- Middlewares globales ----------
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// ---------- Archivos estáticos ----------
// El frontend (HTML/CSS/JS puro) se sirve directamente desde este mismo servidor,
// así todo el proyecto corre con un solo comando y en un solo puerto.
const carpetaFrontend = path.join(__dirname, "..", "..", "frontend");
app.use(express.static(carpetaFrontend, { index: false }));

// Los archivos subidos (documentos de subsanación) también se sirven como estáticos.
// NOTA para producción: esto debería protegerse con autenticación antes de servir el archivo.
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// Si alguien entra a la raíz del sitio, lo mandamos al login.
app.get("/", (req, res) => {
  res.redirect("/login.html");
});

// ---------- Rutas de la API ----------
app.use("/api/auth", authRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/expedientes", expedienteRoutes);

app.get("/api/salud", (req, res) => {
  res.json({ estado: "ok", mensaje: "El servidor está corriendo correctamente." });
});

// ---------- Manejo de errores ----------
app.use(manejadorDeErrores);

// ---------- Arranque ----------
async function iniciar() {
  try {
    await sequelize.authenticate();
    console.log("✅ Conexión a la base de datos establecida.");

    // sync() crea las tablas automáticamente si no existen.
    // Para un proyecto en producción se recomienda usar migraciones
    // (sequelize-cli) en vez de sync(), pero para este alcance es suficiente.
    await sequelize.sync();
    console.log("✅ Modelos sincronizados con la base de datos.");

    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log(`   Frontend: http://localhost:${PORT}/login.html`);
      console.log(`   API:      http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error("❌ No se pudo iniciar el servidor:", error);
    process.exit(1);
  }
}

iniciar();
