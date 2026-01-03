import conexion from "../config/db.js";

function toPlainText(v) {
  if (v == null) return null;
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.map(item => (item == null ? "" : String(item))).join("\n");
  if (typeof v === "object") {
    return Object.entries(v).map(([k, val]) => `${k}: ${val == null ? "" : String(val)}`).join("\n");
  }
  return String(v);
}

export async function obtenerProductos() {
  const conn = await conexion;
  const [rows] = await conn.query("SELECT * FROM producto");
  return rows;
}

export async function obtenerProductoPorId(id) {
  const conn = await conexion;
  const [rows] = await conn.query("SELECT * FROM producto WHERE id_producto = ?", [id]);
  return rows[0];
}

export async function crearProducto(data) {
  const conn = await conexion;
  const {
    nombre_producto,
    descripcion,
    id_categoria = null,
    precio_venta,
    precio_lista = null,
    imagen_url = null,
    stock = 0,
    stock_minimo = 5,
    en_promocion = "no",
    estado = "disponible",
    especificaciones = null,
  } = data;

  const especificacionesVal = toPlainText(especificaciones);

  const [result] = await conn.query(
    `INSERT INTO producto 
     (nombre_producto, descripcion, id_categoria, precio_venta, precio_lista, imagen_url, stock, stock_minimo, en_promocion, estado, especificaciones)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [nombre_producto, descripcion, id_categoria, precio_venta, precio_lista, imagen_url, stock, stock_minimo, en_promocion, estado, especificacionesVal]
  );
  return { id: result.insertId };
}

export async function actualizarProducto(id, data) {
  const conn = await conexion;
  const fields = [];
  const values = [];
  for (const key of ["nombre_producto","descripcion","id_categoria","precio_venta","precio_lista","imagen_url","stock","stock_minimo","en_promocion","estado","especificaciones"]) {
    if (key in data) {
      fields.push(`${key} = ?`);
      let v = data[key];
      if (key === "especificaciones") {
        v = toPlainText(v);
      } else if (v === undefined) {
        v = null;
      }
      values.push(v);
    }
  }
  if (fields.length === 0) return 0;
  values.push(id);
  try {
    const [result] = await conn.query(`UPDATE producto SET ${fields.join(", ")} WHERE id_producto = ?`, values);
    return result.affectedRows;
  } catch (err) {
    console.error("SQL Error actualizarProducto:", { sql: `UPDATE producto SET ${fields.join(", ")} WHERE id_producto = ?`, values, err: err.message });
    throw err;
  }
}

export async function eliminarProducto(id) {
  const conn = await conexion;
  const [result] = await conn.query("DELETE FROM producto WHERE id_producto = ?", [id]);
  return result.affectedRows;
}

export async function obtenerProductosPorCategoria(id_categoria) {
  const conn = await conexion;
  const [rows] = await conn.query(
    "SELECT * FROM producto WHERE id_categoria = ?",
    [id_categoria]
  );
  return rows;
}

export async function obtenerProductosPorNombreCategoria(nombre_categoria) {
  const conn = await conexion;
  const [rows] = await conn.query(
    `SELECT p.* 
     FROM producto p
     JOIN categoria c ON p.id_categoria = c.id_categoria
     WHERE LOWER(c.nombre_categoria) LIKE CONCAT('%', LOWER(?), '%')`,
    [nombre_categoria]
  );
  return rows;
}