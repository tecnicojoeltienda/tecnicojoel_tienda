import * as model from "../models/administrador.model.js";
import bcrypt from "bcryptjs";

export async function listar(req, res) {
  try {
    const rows = await model.obtenerAdmins();
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Error al listar administradores" });
  }
}

export async function crear(req, res) {
  try {
    const { nombre, usuario, clave, rol = "admin", estado = "activo", email } = req.body;

    if (!nombre || !usuario || !clave || !email) {
      return res.status(400).json({ ok: false, error: "nombre, usuario, clave y email son requeridos" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(String(clave), salt);

    const id = await model.crearAdmin({
      nombre,
      usuario,
      clave: hashed,
      rol,
      estado,
      email
    });
    res.status(201).json({ ok: true, id });
  } catch (e) {
    console.error("ERROR crear administrador:", e && (e.stack || e.message || e));
    res.status(500).json({ error: "Error al crear administrador" });
  }
}

/**
 * GET /apij/administrador/estadisticas
 */
export async function estadisticas(req, res) {
  try {
    const stats = await model.obtenerEstadisticas();
    res.json({ ok: true, data: stats });
  } catch (err) {
    console.error("[ESTADISTICAS ADMIN] ", err);
    res.status(500).json({ ok: false, error: "Error al obtener estadísticas" });
  }
}

/**
 * PUT /apij/admins/:id
 * Actualiza únicamente: clave (password), rol y estado (activo/inactivo) y email opcional.
 */
export async function actualizar(req, res) {
  try {
    const id = req.params.id;
    const { clave, rol, estado, email } = req.body;

    if (clave === undefined && rol === undefined && estado === undefined && email === undefined) {
      return res.status(400).json({ ok: false, error: "No hay campos válidos para actualizar" });
    }

    const payload = {};

    if (clave !== undefined && clave !== null && String(clave).trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(String(clave), salt);
      payload.clave = hashed;
    }

    if (rol !== undefined) payload.rol = rol;
    if (estado !== undefined) payload.estado = estado;
    if (email !== undefined) payload.email = email;

    const result = await model.actualizarAdmin(id, payload);

    if (result && result.affectedRows > 0) {
      return res.status(200).json({ ok: true });
    } else {
      return res.status(200).json({ ok: false, error: "No se realizó ninguna modificación" });
    }
  } catch (err) {
    console.error("ERROR actualizar administrador:", err && (err.stack || err.message || err));
    res.status(500).json({ ok: false, error: "Error al actualizar administrador" });
  }
}