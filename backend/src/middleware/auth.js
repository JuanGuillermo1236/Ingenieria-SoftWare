const { verificarToken } = require("../utils/jwt");

// Verifica que la petición traiga un token JWT válido en el header:
//   Authorization: Bearer <token>
function requiereAutenticacion(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No se envió un token de autenticación." });
  }

  const token = header.split(" ")[1];

  try {
    const payload = verificarToken(token);
    req.usuario = payload; // { id, rol, nombre }
    next();
  } catch (error) {
    return res.status(401).json({ error: "Token inválido o expirado. Vuelve a iniciar sesión." });
  }
}

// Middleware "de fábrica": requiereRol("admin") o requiereRol("docente", "admin")
function requiereRol(...rolesPermitidos) {
  return function (req, res, next) {
    if (!req.usuario) {
      return res.status(401).json({ error: "No autenticado." });
    }
    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({ error: "No tienes permisos para realizar esta acción." });
    }
    next();
  };
}

module.exports = { requiereAutenticacion, requiereRol };
