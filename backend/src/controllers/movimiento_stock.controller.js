import * as model from "../models/movimiento_stock.model.js";

export async function listar(req, res) {
  try {
    const rows = await model.obtenerMovimientos();
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Error al listar movimientos" });
  }
}

export async function ver(req, res) {
  try {
    const row = await model.obtenerMovimientoPorId(req.params.id);
    if (!row) return res.status(404).json({ error: "Movimiento no encontrado" });
    res.json(row);
  } catch (e) {
    res.status(500).json({ error: "Error al obtener movimiento" });
  }
}

export async function crear(req, res) {
  try {
    const id = await model.crearMovimiento(req.body);
    res.status(201).json({ ok: true, id });
  } catch (e) {
    res.status(500).json({ error: "Error al crear movimiento" });
  }
}

export async function eliminar(req, res) {
  try {
    const affected = await model.eliminarMovimiento(req.params.id);
    res.json({ ok: true, affected });
  } catch (e) {
    res.status(500).json({ error: "Error al eliminar movimiento" });
  }
}