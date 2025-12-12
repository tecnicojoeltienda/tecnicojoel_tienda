import conexion from "../config/db.js";

export async function obtenerMovimientos() {
  const conn = await conexion;
  const [rows] = await conn.query("SELECT * FROM movimiento_stock");
  return rows;
}

export async function obtenerMovimientoPorId(id) {
  const conn = await conexion;
  const [rows] = await conn.query("SELECT * FROM movimiento_stock WHERE id_movimiento = ?", [id]);
  return rows[0];
}

export async function crearMovimiento({ id_producto, tipo, cantidad, descripcion }) {
  const conn = await conexion;
  const [result] = await conn.query(
    "INSERT INTO movimiento_stock (id_producto, tipo, cantidad, descripcion) VALUES (?, ?, ?, ?)",
    [id_producto || null, tipo, cantidad, descripcion]
  );
  // Actualizar stock del producto (entrada = +, salida = -)
  if (id_producto) {
    const delta = tipo === "entrada" ? cantidad : -cantidad;
    await conn.query("UPDATE producto SET stock = stock + ? WHERE id_producto = ?", [delta, id_producto]);
  }
  return { id: result.insertId };
}

export async function eliminarMovimiento(id) {
  const conn = await conexion;
  const [result] = await conn.query("DELETE FROM movimiento_stock WHERE id_movimiento = ?", [id]);
  return result.affectedRows;
}