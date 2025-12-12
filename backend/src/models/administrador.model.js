import conexion from "../config/db.js";

export async function obtenerAdmins() {
  const conn = await conexion;
  const [rows] = await conn.query("SELECT id_admin, nombre, usuario, email, rol, estado FROM administrador");
  return rows;
}

export async function obtenerAdminPorUsuario(usuario) {
  const conn = await conexion;
  const [rows] = await conn.query("SELECT * FROM administrador WHERE usuario = ?", [usuario]);
  return rows[0];
}

export async function crearAdmin({ nombre, usuario, clave, rol = "admin", estado = "activo", email = null }) {
  const conn = await conexion;
  const [result] = await conn.query(
    "INSERT INTO administrador (nombre, usuario, clave, rol, estado, email) VALUES (?, ?, ?, ?, ?, ?)",
    [nombre, usuario, clave, rol, estado, email]
  );
  return { id: result.insertId };
}

// actualizar sólo permite clave (hashed), rol, estado y email
export async function actualizarAdmin(id, data) {
  const conn = await conexion;
  const allowed = ["clave", "rol", "estado", "email"];
  const fields = [];
  const values = [];

  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      fields.push(`${key} = ?`);
      values.push(data[key]);
    }
  }

  if (fields.length === 0) {
    return { affectedRows: 0 };
  }

  values.push(id);
  try {
    const [result] = await conn.query(`UPDATE administrador SET ${fields.join(", ")} WHERE id_admin = ?`, values);
    return result;
  } catch (err) {
    console.error("SQL Error actualizarAdmin:", { sql: `UPDATE administrador SET ${fields.join(", ")} WHERE id_admin = ?`, values, err: err.message });
    throw err;
  }
}

/*=====================================
ESTADISTICAS COMPLETAS PARA EL DASHBOARD
(Mantengo el resto tal cual en tu archivo original)
======================================*/
export async function obtenerEstadisticas() {
  const conn = await conexion;

  // 1. Total clientes
  const [rClientes] = await conn.query("SELECT COUNT(*) AS total FROM cliente");
  const total_clientes = Number(rClientes?.[0]?.total || 0);

  // 2. Total productos
  const [rProductos] = await conn.query("SELECT COUNT(*) AS total FROM producto");
  const total_productos = Number(rProductos?.[0]?.total || 0);

  // 3. Total movimientos
  const [rMovimientos] = await conn.query("SELECT COUNT(*) AS total FROM movimiento_stock");
  const total_movimientos = Number(rMovimientos?.[0]?.total || 0);

  // 4. Total ventas (número de transacciones)
  const [rNumVentas] = await conn.query("SELECT COUNT(*) AS total FROM venta");
  const total_ventas = Number(rNumVentas?.[0]?.total || 0);

  // 5. Total usuarios (administradores)
  const [rUsuarios] = await conn.query("SELECT COUNT(*) AS total FROM administrador");
  const total_usuarios = Number(rUsuarios?.[0]?.total || 0);

  // 6. Total pedidos
  const [rPedidos] = await conn.query("SELECT COUNT(*) AS total FROM pedido");
  const total_pedidos = Number(rPedidos?.[0]?.total || 0);

  // 7. Total ingresos en soles (suma de ventas)
  let total_ingresos = 0;
  try {
    const [rIngresos] = await conn.query("SELECT IFNULL(SUM(total),0) AS total FROM venta");
    total_ingresos = Number(rIngresos?.[0]?.total || 0);
  } catch (e) {
    try {
      const [rPedidosComp] = await conn.query("SELECT IFNULL(SUM(total),0) AS total FROM pedido WHERE estado = 'completado'");
      total_ingresos = Number(rPedidosComp?.[0]?.total || 0);
    } catch {
      total_ingresos = 0;
    }
  }

  // 8. Total entradas y salidas (movimientos)
  let total_entradas = 0;
  let total_salidas = 0;
  try {
    const [rEntradas] = await conn.query("SELECT COUNT(*) AS total FROM movimiento_stock WHERE tipo = 'entrada'");
    total_entradas = Number(rEntradas?.[0]?.total || 0);
    
    const [rSalidas] = await conn.query("SELECT COUNT(*) AS total FROM movimiento_stock WHERE tipo = 'salida'");
    total_salidas = Number(rSalidas?.[0]?.total || 0);
  } catch (e) {
    total_entradas = 0;
    total_salidas = 0;
  }

  // Productos más vendidos (para gráfico de barras)
  let productosMasVendidos = [];
  try {
    const [rVendidos] = await conn.query(`
      SELECT 
        p.id_producto,
        p.nombre_producto AS nombre,
        SUM(dp.cantidad) AS total_vendido,
        p.precio_venta AS precio,
        COUNT(DISTINCT dp.id_pedido) AS veces_pedido
      FROM detalle_pedido dp
      INNER JOIN producto p ON p.id_producto = dp.id_producto
      GROUP BY p.id_producto, p.nombre_producto, p.precio_venta
      ORDER BY total_vendido DESC
      LIMIT 10
    `);
    productosMasVendidos = (rVendidos || []).map(r => ({
      id: r.id_producto,
      nombre: r.nombre || `Producto ${r.id_producto}`,
      total_vendido: Number(r.total_vendido || 0),
      precio: Number(r.precio || 0),
      veces_pedido: Number(r.veces_pedido || 0)
    }));
  } catch (e) {
    console.error("Error obteniendo productos más vendidos:", e);
    productosMasVendidos = [];
  }

  // Estados de pedidos (distribución)
  let pedidosPorEstado = [];
  try {
    const [rEstados] = await conn.query(`
      SELECT estado, COUNT(*) AS cantidad
      FROM pedido
      GROUP BY estado
      ORDER BY cantidad DESC
    `);
    pedidosPorEstado = (rEstados || []).map(r => ({
      estado: r.estado || 'Sin estado',
      cantidad: Number(r.cantidad || 0)
    }));
  } catch (e) {
    pedidosPorEstado = [];
  }

  // Top 5 productos (unidades vendidas)
  let topProductos = [];
  let topProducto = null;
  try {
    const [rTop] = await conn.query(`
      SELECT 
        p.id_producto,
        p.nombre_producto AS nombre,
        SUM(dp.cantidad) AS total_vendido,
        p.precio_venta AS precio
      FROM detalle_pedido dp
      INNER JOIN producto p ON p.id_producto = dp.id_producto
      GROUP BY p.id_producto, p.nombre_producto, p.precio_venta
      ORDER BY total_vendido DESC
      LIMIT 5
    `);
    topProductos = (rTop || []).map(r => ({
      id: r.id_producto,
      nombre: r.nombre || `Producto ${r.id_producto}`,
      total_vendido: Number(r.total_vendido || 0),
      precio: Number(r.precio || 0)
    }));
    if (topProductos.length) topProducto = topProductos[0];
  } catch (e) {
    topProductos = [];
    topProducto = null;
  }

  // Producto estrella (más veces pedido)
  let productoEstrella = null;
  try {
    const [rEstrella] = await conn.query(`
      SELECT 
        p.id_producto,
        p.nombre_producto AS nombre,
        COUNT(DISTINCT dp.id_pedido) AS veces_pedido,
        SUM(dp.cantidad) AS total_unidades,
        p.precio_venta AS precio
      FROM detalle_pedido dp
      INNER JOIN producto p ON p.id_producto = dp.id_producto
      GROUP BY p.id_producto, p.nombre_producto, p.precio_venta
      ORDER BY veces_pedido DESC
      LIMIT 1
    `);
    if (rEstrella && rEstrella.length > 0) {
      productoEstrella = {
        id: rEstrella[0].id_producto,
        nombre: rEstrella[0].nombre || `Producto ${rEstrella[0].id_producto}`,
        veces_pedido: Number(rEstrella[0].veces_pedido || 0),
        total_unidades: Number(rEstrella[0].total_unidades || 0),
        precio: Number(rEstrella[0].precio || 0)
      };
    }
  } catch (e) {
    productoEstrella = null;
  }

  // Stock bajo
  let stockBajo = 0;
  try {
    const [rStock] = await conn.query("SELECT COUNT(*) AS total FROM producto WHERE stock <= stock_minimo");
    stockBajo = Number(rStock?.[0]?.total || 0);
  } catch (e) {
    stockBajo = 0;
  }

  // Ventas por mes (últimos 6 meses)
  let ventasPorMes = [];
  try {
    const [rMes] = await conn.query(`
      SELECT 
        DATE_FORMAT(fecha_venta, '%Y-%m') AS mes,
        IFNULL(SUM(total),0) AS total,
        COUNT(*) AS cantidad_ventas,
        IFNULL(AVG(total),0) AS promedio
      FROM venta
      WHERE fecha_venta >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY mes
      ORDER BY mes ASC
    `);
    ventasPorMes = (rMes || []).map(r => ({
      mes: r.mes,
      total: Number(r.total || 0),
      cantidad: Number(r.cantidad_ventas || 0),
      promedio: Number(r.promedio || 0)
    }));
  } catch (e) {
    // Fallback a pedidos completados
    try {
      const [rMes2] = await conn.query(`
        SELECT 
          DATE_FORMAT(fecha_pedido, '%Y-%m') AS mes,
          IFNULL(SUM(total),0) AS total,
          COUNT(*) AS cantidad_ventas
        FROM pedido
        WHERE fecha_pedido >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
          AND estado = 'completado'
        GROUP BY mes
        ORDER BY mes ASC
      `);
      ventasPorMes = (rMes2 || []).map(r => ({
        mes: r.mes,
        total: Number(r.total || 0),
        cantidad: Number(r.cantidad_ventas || 0),
        promedio: r.total && r.cantidad_ventas ? Number(r.total) / Number(r.cantidad_ventas) : 0
      }));
    } catch {
      ventasPorMes = [];
    }
  }

  // Promedio diario de ventas
  let promedioDiario = 0;
  try {
    const [rProm] = await conn.query(`
      SELECT IFNULL(AVG(daily_total),0) AS promedio
      FROM (
        SELECT DATE(fecha_venta) AS fecha, SUM(total) AS daily_total
        FROM venta
        WHERE fecha_venta >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY DATE(fecha_venta)
      ) AS daily_sales
    `);
    promedioDiario = Number(rProm?.[0]?.promedio || 0);
  } catch (e) {
    promedioDiario = 0;
  }

  return {
    // 8 estadísticas principales
    total_clientes,
    total_productos,
    total_movimientos,
    total_ventas,
    total_usuarios,
    total_pedidos,
    total_ingresos,
    total_entradas,
    total_salidas,
    
    // Datos para gráficos y secciones
    productosMasVendidos,
    pedidosPorEstado,
    topProductos,
    topProducto,
    productoEstrella,
    stockBajo,
    ventasPorMes,
    promedioDiario
  };
}