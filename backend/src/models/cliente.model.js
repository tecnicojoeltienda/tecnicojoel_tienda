import conexion from "../config/db.js";

// BUSCAR CLIENTE POR EMAIL
export async function buscarPorEmail(email) {
  const conn = await conexion;
  const [rows] = await conn.query("SELECT * FROM cliente WHERE email = ? LIMIT 1", [email]);
  return rows[0] ?? null;
}

// BUSCAR CLIENTE POR ID
export async function buscarPorId(id) {
  const conn = await conexion;
  const [rows] = await conn.query("SELECT * FROM cliente WHERE id_cliente = ? LIMIT 1", [id]);
  return rows[0] ?? null;
}

// CREAR NUEVO CLIENTE
export async function crearCliente(data) {
  const conn = await conexion;
  const {
    nombre = null,
    apellido = null,
    dni = null,
    telefono = null,
    email = null,
    direccion = null,
    clave = null,
  } = data;

  const sql = `INSERT INTO cliente
    (nombre, apellido, dni, telefono, email, direccion, clave)
    VALUES (?, ?, ?, ?, ?, ?, ?)`;

  const params = [nombre, apellido, dni, telefono, email, direccion, clave];
  const [result] = await conn.query(sql, params);
  return { insertId: result.insertId, affectedRows: result.affectedRows ?? result.affected_rows ?? 1 };
}

// LISTAR TODOS LOS CLIENTES
export async function listarClientes() {
  const conn = await conexion;
  const [rows] = await conn.query("SELECT * FROM cliente ORDER BY id_cliente DESC");
  return rows;
}

// ACTUALIZAR CLIENTE (SOLO CAMPOS ENVIADOS)
export async function actualizarCliente(id, data = {}) {
  const conn = await conexion;
  const fields = [];
  const params = [];

  if (Object.prototype.hasOwnProperty.call(data, "nombre")) {
    fields.push("nombre = ?");
    params.push(data.nombre);
  }
  if (Object.prototype.hasOwnProperty.call(data, "apellido")) {
    fields.push("apellido = ?");
    params.push(data.apellido);
  }
  if (Object.prototype.hasOwnProperty.call(data, "email")) {
    fields.push("email = ?");
    params.push(data.email);
  }
  if (Object.prototype.hasOwnProperty.call(data, "telefono")) {
    fields.push("telefono = ?");
    params.push(data.telefono);
  }
  if (Object.prototype.hasOwnProperty.call(data, "clave")) {
    fields.push("clave = ?");
    params.push(data.clave);
  }

  if (fields.length === 0) {
    return { affectedRows: 0 };
  }

  const sql = `UPDATE cliente SET ${fields.join(", ")} WHERE id_cliente = ?`;
  params.push(id);

  const [result] = await conn.query(sql, params);
  return { affectedRows: result.affectedRows ?? result.affected_rows ?? 0 };
}