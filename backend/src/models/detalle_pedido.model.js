import conexion from "../config/db.js";

export async function listarDetalles() {
  const conn = await conexion;
  const [rows] = await conn.query("SELECT * FROM detalle_pedido ORDER BY id_detalle_pedido DESC");
  return rows;
}

export async function buscarPorId(id) {
  const conn = await conexion;
  const [rows] = await conn.query("SELECT * FROM detalle_pedido WHERE id_detalle_pedido = ? LIMIT 1", [id]);
  return rows[0] ?? null;
}

export async function listarPorPedido(id_pedido) {
  const conn = await conexion;
  const [rows] = await conn.query("SELECT * FROM detalle_pedido WHERE id_pedido = ? ORDER BY id_detalle_pedido ASC", [id_pedido]);
  return rows;
}

export async function crearDetalle({ id_pedido = null, id_producto = null, cantidad = 1, precio_unitario = 0.0 }) {
  const conn = await conexion;
  const sql = `INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unitario) VALUES (?, ?, ?, ?)`;
  const params = [id_pedido, id_producto, cantidad, precio_unitario];
  const [result] = await conn.query(sql, params);
  return { insertId: result.insertId, affectedRows: result.affectedRows ?? 1 };
}

export async function actualizarDetalle(id, { id_pedido = null, id_producto = null, cantidad = null, precio_unitario = null }) {
  const conn = await conexion;
  const parts = [];
  const params = [];
  if (id_pedido !== null) { parts.push("id_pedido = ?"); params.push(id_pedido); }
  if (id_producto !== null) { parts.push("id_producto = ?"); params.push(id_producto); }
  if (cantidad !== null) { parts.push("cantidad = ?"); params.push(cantidad); }
  if (precio_unitario !== null) { parts.push("precio_unitario = ?"); params.push(precio_unitario); }
  if (parts.length === 0) return { affectedRows: 0 };
  const sql = `UPDATE detalle_pedido SET ${parts.join(", ")} WHERE id_detalle_pedido = ?`;
  params.push(id);
  const [result] = await conn.query(sql, params);
  return { affectedRows: result.affectedRows };
}

export async function eliminarDetalle(id) {
  const conn = await conexion;
  const [result] = await conn.query("DELETE FROM detalle_pedido WHERE id_detalle_pedido = ?", [id]);
  return { affectedRows: result.affectedRows };
}