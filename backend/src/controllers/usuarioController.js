const bcrypt = require("bcryptjs");
const { Usuario } = require("../models");

async function listar(req, res, next) {
  try {
    const { rol } = req.query; // ?rol=estudiante  ó  ?rol=docente
    const filtro = rol ? { rol } : {};

    const usuarios = await Usuario.findAll({
      where: filtro,
      attributes: ["id", "nombre", "correo", "rol", "createdAt"],
      order: [["nombre", "ASC"]],
    });

    res.json(usuarios);
  } catch (error) {
    next(error);
  }
}

async function crear(req, res, next) {
  try {
    const { nombre, correo, password, rol } = req.body;

    if (!nombre || !correo || !password || !rol) {
      return res.status(400).json({ error: "nombre, correo, password y rol son obligatorios." });
    }

    if (!Usuario.ROLES.includes(rol)) {
      return res.status(400).json({ error: `rol debe ser uno de: ${Usuario.ROLES.join(", ")}` });
    }

    const existe = await Usuario.findOne({ where: { correo } });
    if (existe) {
      return res.status(409).json({ error: "Ya existe un usuario con ese correo." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const usuario = await Usuario.create({ nombre, correo, passwordHash, rol });

    res.status(201).json({
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { listar, crear };
