import conexion from "../config/db.js";

export async function listarVentas() {
  const conn = await conexion;
  const [rows] = await conn.query("SELECT * FROM venta ORDER BY fecha_venta DESC");
  return rows;
}

export async function buscarVentaPorId(id) {
  const conn = await conexion;
  const [rows] = await conn.query("SELECT * FROM venta WHERE id_venta = ? LIMIT 1", [id]);
  return rows[0] ?? null;
}

export async function crearVenta({ id_pedido = null, total = 0.0, metodo_pago = "efectivo" }) {
  const conn = await conexion;
  const sql = `INSERT INTO venta (id_pedido, total, metodo_pago) VALUES (?, ?, ?)`;
  const [result] = await conn.query(sql, [id_pedido, total, metodo_pago]);
  return { insertId: result.insertId, affectedRows: result.affectedRows ?? 1 };
}

export async function actualizarVenta(id, { id_pedido = null, total = null, metodo_pago = null }) {
  const conn = await conexion;
  const parts = [];
  const params = [];
  if (id_pedido !== null) { parts.push("id_pedido = ?"); params.push(id_pedido); }
  if (total !== null) { parts.push("total = ?"); params.push(total); }
  if (metodo_pago !== null) { parts.push("metodo_pago = ?"); params.push(metodo_pago); }
  if (parts.length === 0) return { affectedRows: 0 };
  const sql = `UPDATE venta SET ${parts.join(", ")} WHERE id_venta = ?`;
  params.push(id);
  const [result] = await conn.query(sql, params);
  return { affectedRows: result.affectedRows };
}

export async function eliminarVenta(id) {
  const conn = await conexion;
  const [result] = await conn.query("DELETE FROM venta WHERE id_venta = ?", [id]);
  return { affectedRows: result.affectedRows };
}