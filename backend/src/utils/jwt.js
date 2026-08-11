const jwt = require("jsonwebtoken");

const SECRETO = process.env.JWT_SECRET || "clave-de-desarrollo";
const EXPIRA_EN = process.env.JWT_EXPIRES_IN || "8h";

function generarToken(usuario) {
  // Guardamos solo lo mínimo necesario dentro del token (nunca la contraseña).
  return jwt.sign(
    { id: usuario.id, rol: usuario.rol, nombre: usuario.nombre },
    SECRETO,
    { expiresIn: EXPIRA_EN }
  );
}

function verificarToken(token) {
  return jwt.verify(token, SECRETO);
}

module.exports = { generarToken, verificarToken };
