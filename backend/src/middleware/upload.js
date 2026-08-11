const multer = require("multer");
const path = require("path");
const fs = require("fs");

const carpetaUploads = path.join(__dirname, "..", "..", "uploads");

if (!fs.existsSync(carpetaUploads)) {
  fs.mkdirSync(carpetaUploads, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, carpetaUploads);
  },
  filename: function (req, file, cb) {
    const sufijoUnico = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, `${sufijoUnico}${extension}`);
  },
});

const tiposPermitidos = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"];

function filtroArchivos(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (tiposPermitidos.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Tipo de archivo no permitido. Usa PDF, Word o imágenes."));
  }
}

const upload = multer({
  storage,
  fileFilter: filtroArchivos,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

module.exports = upload;
