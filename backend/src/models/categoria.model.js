import conexion from "../config/db.js";

export async function obtenerCategorias() {
  const conn = await conexion;
  const [rows] = await conn.query("SELECT * FROM categoria");
  return rows;
}

export async function obtenerCategoriaPorId(id) {
  const conn = await conexion;
  const [rows] = await conn.query("SELECT * FROM categoria WHERE id_categoria = ?", [id]);
  return rows[0];
}

export async function crearCategoria({ nombre_categoria, descripcion }) {
  const conn = await conexion;
  const [result] = await conn.query(
    "INSERT INTO categoria (nombre_categoria, descripcion) VALUES (?, ?)",
    [nombre_categoria, descripcion]
  );
  return { id: result.insertId };
}

export async function actualizarCategoria(id, { nombre_categoria, descripcion }) {
  const conn = await conexion;
  const [result] = await conn.query(
    "UPDATE categoria SET nombre_categoria = ?, descripcion = ? WHERE id_categoria = ?",
    [nombre_categoria, descripcion, id]
  );
  return result.affectedRows;
}

export async function eliminarCategoria(id) {
  const conn = await conexion;
  const [result] = await conn.query("DELETE FROM categoria WHERE id_categoria = ?", [id]);
  return result.affectedRows;
}