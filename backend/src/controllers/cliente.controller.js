import * as Cliente from "../models/cliente.model.js";
import bcrypt from "bcryptjs";

/**
 * Controlador: creación, listado, búsqueda y actualización de cliente.
 * Respuestas: { success: true/false, data: ... }
 */

export async function crear(req, res) {
  try {
    const { nombre, apellido, dni, telefono, email, direccion, clave } = req.body;

    if (!email || !clave) {
      return res.status(400).json({ success: false, data: null, message: "El email y la clave son obligatorios" });
    }

    // email único
    const existente = await Cliente.buscarPorEmail(email);
    if (existente) return res.status(409).json({ success: false, data: null, message: "El email ya está registrado" });

    // hashear clave
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(String(clave), salt);

    const result = await Cliente.crearCliente({
      nombre,
      apellido,
      dni,
      telefono,
      email,
      direccion,
      clave: hashed,
    });

    const nuevo = await Cliente.buscarPorId(result.insertId);
    return res.status(201).json({ success: true, data: nuevo });
  } catch (err) {
    console.error("ERROR crear cliente:", err && (err.stack || err.message || err));
    return res.status(500).json({ success: false, data: null, message: "Error al crear cliente" });
  }
}

export async function listar(req, res) {
  try {
    const rows = await Cliente.listarClientes();
    if (Array.isArray(rows) && rows.length > 0) {
      return res.status(200).json({ success: true, data: rows });
    } else {
      return res.status(200).json({ success: false, data: [] });
    }
  } catch (err) {
    console.error("ERROR listar clientes:", err && (err.stack || err.message || err));
    return res.status(500).json({ success: false, data: null, message: "Error al listar clientes" });
  }
}

export async function buscar(req, res) {
  try {
    const id = req.params.id;
    const row = await Cliente.buscarPorId(id);
    if (row) return res.status(200).json({ success: true, data: row });
    return res.status(200).json({ success: false, data: null });
  } catch (err) {
    console.error("ERROR buscar cliente:", err && (err.stack || err.message || err));
    return res.status(500).json({ success: false, data: null, message: "Error al buscar cliente" });
  }
}

export async function actualizar(req, res) {
  try {
    const id = req.params.id;
    const { nombre, apellido, email, telefono } = req.body;

    // Validación mínima: al menos un campo para actualizar
    if (nombre === undefined && apellido === undefined && email === undefined && telefono === undefined) {
      return res.status(400).json({ success: false, data: null, message: "No hay campos para actualizar" });
    }

    // Si se envía email, comprobar unicidad
    if (email) {
      const existente = await Cliente.buscarPorEmail(email);
      if (existente && Number(existente.id_cliente) !== Number(id)) {
        return res.status(409).json({ success: false, data: null, message: "El email ya está registrado por otro usuario" });
      }
    }

    const payload = {};
    if (nombre !== undefined) payload.nombre = nombre;
    if (apellido !== undefined) payload.apellido = apellido;
    if (email !== undefined) payload.email = email;
    if (telefono !== undefined) payload.telefono = telefono;

    const result = await Cliente.actualizarCliente(id, payload);

    if (result.affectedRows > 0) {
      const updated = await Cliente.buscarPorId(id);
      return res.status(200).json({ success: true, data: updated });
    } else {
      return res.status(200).json({ success: false, data: null });
    }
  } catch (err) {
    console.error("ERROR actualizar cliente:", err && (err.stack || err.message || err));
    return res.status(500).json({ success: false, data: null, message: "Error al actualizar cliente" });
  }
}