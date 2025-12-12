import * as Detalle from "../models/detalle_pedido.model.js";

export async function listar(req, res) {
  try {
    const rows = await Detalle.listarDetalles();
    return res.json(rows);
  } catch (err) {
    console.error("Error listar detalle_pedido:", err);
    return res.status(500).json({ message: "Error al listar detalles" });
  }
}

export async function obtener(req, res) {
  try {
    const id = Number(req.params.id);
    const row = await Detalle.buscarPorId(id);
    if (!row) return res.status(404).json({ message: "Detalle no encontrado" });
    return res.json(row);
  } catch (err) {
    console.error("Error obtener detalle:", err);
    return res.status(500).json({ message: "Error al obtener detalle" });
  }
}

export async function listarPorPedido(req, res) {
  try {
    const id_pedido = Number(req.params.id);
    const rows = await Detalle.listarPorPedido(id_pedido);
    return res.json(rows);
  } catch (err) {
    console.error("Error listar por pedido:", err);
    return res.status(500).json({ message: "Error al listar detalles del pedido" });
  }
}

export async function crear(req, res) {
  try {
    const { id_pedido, id_producto, cantidad = 1, precio_unitario = 0 } = req.body;

    if (id_pedido == null || id_producto == null) {
      return res.status(400).json({ message: "id_pedido e id_producto son obligatorios" });
    }

    const result = await Detalle.crearDetalle({ id_pedido, id_producto, cantidad, precio_unitario });
    const nuevo = await Detalle.buscarPorId(result.insertId);
    return res.status(201).json(nuevo);
  } catch (err) {
    console.error("Error crear detalle:", err);
    // detectar error de FK opcional
    if (err && err.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({ message: "id_pedido o id_producto no existe (clave foránea)" });
    }
    return res.status(500).json({ message: "Error al crear detalle" });
  }
}

export async function actualizar(req, res) {
  try {
    const id = Number(req.params.id);
    const existing = await Detalle.buscarPorId(id);
    if (!existing) return res.status(404).json({ message: "Detalle no encontrado" });

    const cambios = req.body;
    const result = await Detalle.actualizarDetalle(id, cambios);
    if (result.affectedRows === 0) return res.status(400).json({ message: "No se realizó ningún cambio" });
    const updated = await Detalle.buscarPorId(id);
    return res.json(updated);
  } catch (err) {
    console.error("Error actualizar detalle:", err);
    return res.status(500).json({ message: "Error al actualizar detalle" });
  }
}

export async function eliminar(req, res) {
  try {
    const id = Number(req.params.id);
    const existing = await Detalle.buscarPorId(id);
    if (!existing) return res.status(404).json({ message: "Detalle no encontrado" });
    const result = await Detalle.eliminarDetalle(id);
    return res.json({ deleted: result.affectedRows === 1 });
  } catch (err) {
    console.error("Error eliminar detalle:", err);
    return res.status(500).json({ message: "Error al eliminar detalle" });
  }
}