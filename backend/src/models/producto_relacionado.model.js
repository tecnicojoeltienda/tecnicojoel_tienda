import pool from "../config/db.js";

/**
 * Guardar productos relacionados para un producto específico
 * @param {number} idProducto - ID del producto principal
 * @param {Array<number>} idsRelacionados - Array de IDs de productos relacionados
 */
export async function guardarProductosRelacionados(idProducto, idsRelacionados) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Eliminar relaciones existentes
    await conn.query(
      "DELETE FROM producto_relacionado WHERE id_producto = ?",
      [idProducto]
    );

    // Insertar nuevas relaciones
    if (idsRelacionados && idsRelacionados.length > 0) {
      const values = idsRelacionados.map(idRel => [idProducto, idRel]);
      await conn.query(
        "INSERT INTO producto_relacionado (id_producto, id_producto_relacionado) VALUES ?",
        [values]
      );
    }

    await conn.commit();
    return { success: true, count: idsRelacionados.length };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

/**
 * Obtener productos relacionados de un producto
 * @param {number} idProducto - ID del producto principal
 * @returns {Array} Array de productos relacionados completos
 */
export async function obtenerProductosRelacionados(idProducto) {
  const [rows] = await pool.query(
    `SELECT 
      p.*,
      c.nombre_categoria as categoria
    FROM producto_relacionado pr
    INNER JOIN producto p ON pr.id_producto_relacionado = p.id_producto
    LEFT JOIN categoria c ON p.id_categoria = c.id_categoria
    WHERE pr.id_producto = ?
    ORDER BY pr.fecha_creacion DESC`,
    [idProducto]
  );
  return rows;
}

/**
 * Eliminar una relación específica
 * @param {number} idProducto - ID del producto principal
 * @param {number} idProductoRelacionado - ID del producto relacionado
 */
export async function eliminarRelacion(idProducto, idProductoRelacionado) {
  const [result] = await pool.query(
    "DELETE FROM producto_relacionado WHERE id_producto = ? AND id_producto_relacionado = ?",
    [idProducto, idProductoRelacionado]
  );
  return result.affectedRows;
}

/**
 * Obtener conteo de productos relacionados
 * @param {number} idProducto - ID del producto principal
 */
export async function contarProductosRelacionados(idProducto) {
  const [rows] = await pool.query(
    "SELECT COUNT(*) as total FROM producto_relacionado WHERE id_producto = ?",
    [idProducto]
  );
  return rows[0]?.total || 0;
}