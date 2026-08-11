const bcrypt = require("bcryptjs");
const { Usuario } = require("../models");
const { generarToken } = require("../utils/jwt");

async function login(req, res, next) {
  try {
    const { correo, password } = req.body;

    if (!correo || !password) {
      return res.status(400).json({ error: "Correo y contraseña son obligatorios." });
    }

    const usuario = await Usuario.findOne({ where: { correo } });

    if (!usuario) {
      // Mensaje genérico a propósito: no revelamos si el correo existe o no.
      return res.status(401).json({ error: "Correo o contraseña incorrectos." });
    }

    const coincide = await bcrypt.compare(password, usuario.passwordHash);
    if (!coincide) {
      return res.status(401).json({ error: "Correo o contraseña incorrectos." });
    }

    const token = generarToken(usuario);

    res.json({
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function me(req, res, next) {
  try {
    const usuario = await Usuario.findByPk(req.usuario.id, {
      attributes: ["id", "nombre", "correo", "rol"],
    });
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }
    res.json(usuario);
  } catch (error) {
    next(error);
  }
}

module.exports = { login, me };
