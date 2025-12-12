import * as model from "../models/categoria.model.js";

export async function listar(req, res) {
  try {
    const rows = await model.obtenerCategorias();
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Error al listar categorías" });
  }
}

export async function ver(req, res) {
  try {
    const row = await model.obtenerCategoriaPorId(req.params.id);
    if (!row) return res.status(404).json({ error: "Categoría no encontrada" });
    res.json(row);
  } catch (e) {
    res.status(500).json({ error: "Error al obtener categoría" });
  }
}

export async function crear(req, res) {
  try {
    const id = await model.crearCategoria(req.body);
    res.status(201).json({ ok: true, id });
  } catch (e) {
    res.status(500).json({ error: "Error al crear categoría" });
  }
}

export async function actualizar(req, res) {
  try {
    const affected = await model.actualizarCategoria(req.params.id, req.body);
    res.json({ ok: true, affected });
  } catch (e) {
    res.status(500).json({ error: "Error al actualizar categoría" });
  }
}

export async function eliminar(req, res) {
  try {
    const affected = await model.eliminarCategoria(req.params.id);
    res.json({ ok: true, affected });
  } catch (e) {
    res.status(500).json({ error: "Error al eliminar categoría" });
  }
}