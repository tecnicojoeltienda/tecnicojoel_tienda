import conexion from "../config/db.js";

/**
 * Buscar código de descuento por nombre
 */
export async function buscarPorCodigo(codigo) {
  const conn = await conexion;
  const [rows] = await conn.query(
    "SELECT * FROM codigo_descuento WHERE codigo = ? LIMIT 1",
    [codigo]
  );
  return rows[0] ?? null;
}

/**
 * Validar si un código está disponible para usar
 */
export async function validarCodigo(codigo) {
  const conn = await conexion;
  const [rows] = await conn.query(
    `SELECT 
      id_codigo,
      codigo,
      porcentaje,
      max_usos,
      usos_actuales,
      activo,
      (max_usos - usos_actuales) AS usos_disponibles
    FROM codigo_descuento 
    WHERE codigo = ? AND activo = 1
    LIMIT 1`,
    [codigo]
  );
  
  if (!rows || rows.length === 0) {
    return { valid: false, message: "Código de descuento inválido" };
  }
  
  const cd = rows[0];
  
  if (cd.usos_actuales >= cd.max_usos) {
    return { 
      valid: false, 
      message: `Este código ya alcanzó el límite máximo de ${cd.max_usos} usos`,
      data: cd
    };
  }
  
  return { 
    valid: true, 
    message: "Código válido",
    data: cd
  };
}

/**
 * Consumir un uso del código (incrementar contador)
 */
export async function consumirCodigo(codigo) {
  const conn = await conexion;
  
  // Validar primero
  const validation = await validarCodigo(codigo);
  if (!validation.valid) {
    throw new Error(validation.message);
  }
  
  const [result] = await conn.query(
    `UPDATE codigo_descuento 
     SET usos_actuales = usos_actuales + 1 
     WHERE codigo = ? AND activo = 1 AND usos_actuales < max_usos`,
    [codigo]
  );
  
  if (result.affectedRows === 0) {
    throw new Error("No se pudo consumir el código (límite alcanzado o código inactivo)");
  }
  
  return await buscarPorCodigo(codigo);
}

/**
 * Decrementar usos_actuales (devolver un uso del código).
 * No permite que usos_actuales baje de 0.
 */
export async function liberarCodigo(codigo) {
  const conn = await conexion;

  // Intentar decrementar de manera segura
  const [result] = await conn.query(
    `UPDATE codigo_descuento
     SET usos_actuales = GREATEST(COALESCE(usos_actuales,0) - 1, 0)
     WHERE codigo = ?`,
    [codigo]
  );

  return await buscarPorCodigo(codigo);
}

/**
 * Listar todos los códigos
 */
export async function listarCodigos() {
  const conn = await conexion;
  const [rows] = await conn.query(
    `SELECT 
      *,
      (max_usos - usos_actuales) AS usos_disponibles
    FROM codigo_descuento 
    ORDER BY codigo ASC`
  );
  return rows;
}