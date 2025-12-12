import conexion from "../config/db.js";
import * as DetalleModel from "./detalle_pedido.model.js";
import * as MovimientoModel from "./movimiento_stock.model.js";

export async function listarPedidos() {
  const conn = await conexion;
  const [rows] = await conn.query("SELECT * FROM pedido ORDER BY fecha_pedido DESC");
  return rows;
}

export async function buscarPedidoPorId(id) {
  const conn = await conexion;
  const [rows] = await conn.query("SELECT * FROM pedido WHERE id_pedido = ? LIMIT 1", [id]);
  return rows[0] ?? null;
}

export async function crearPedido({ 
  id_cliente = null, 
  estado = "pendiente", 
  total = 0.0,
  codigo_descuento = null,
  porcentaje_descuento = null
}) {
  const conn = await conexion;
  const sql = `INSERT INTO pedido (id_cliente, estado, total, codigo_descuento, porcentaje_descuento) 
               VALUES (?, ?, ?, ?, ?)`;
  const [result] = await conn.query(sql, [
    id_cliente, 
    estado, 
    total,
    codigo_descuento,
    porcentaje_descuento
  ]);
  return { insertId: result.insertId, affectedRows: result.affectedRows ?? 1 };
}

export async function actualizarPedido(id, { id_cliente = null, estado = null, total = null }) {
  const conn = await conexion;

  // Obtener estado actual del pedido (si existe)
  const existing = await buscarPedidoPorId(id);

  // solo setea las columnas recibidas (parcial)
  const parts = [];
  const params = [];
  if (id_cliente !== null) { parts.push("id_cliente = ?"); params.push(id_cliente); }
  if (estado !== null) { parts.push("estado = ?"); params.push(estado); }
  if (total !== null) { parts.push("total = ?"); params.push(total); }

  // Si no hay nada para actualizar, no hacemos nada
  if (parts.length === 0) return { affectedRows: 0 };

  const sql = `UPDATE pedido SET ${parts.join(", ")} WHERE id_pedido = ?`;
  params.push(id);
  const [result] = await conn.query(sql, params);

  // Si se actualizó el estado y el nuevo estado indica finalización,
  // creamos una venta en la tabla `venta` y generamos movimientos de salida
  let ventaId = null;
  try {
    if (estado !== null) {
      const newState = String(estado).toLowerCase();
      const wasState = existing && String(existing.estado || "").toLowerCase();

      const isFinalState = (newState === "finalizado" || newState === "finalizar" || newState === "completado");
      const wasAlreadyFinal = (wasState === "finalizado" || wasState === "completado");

      if (isFinalState && !wasAlreadyFinal) {
        // Determinar total para la venta: preferir total recibido, si no, usar total del pedido
        let saleTotal = (total !== null) ? Number(total) : (existing && Number(existing.total)) ?? 0;

        // Si aún no tenemos un total válido (>0), intentar sumar los subtotales en detalle_pedido
        if (!saleTotal || Number(saleTotal) === 0) {
          const [rows] = await conn.query(
            "SELECT COALESCE(SUM(subtotal), 0) AS sum_total FROM detalle_pedido WHERE id_pedido = ?",
            [id]
          );
          saleTotal = (rows && rows[0] && rows[0].sum_total) ? Number(rows[0].sum_total) : 0;
        }

        // Insertar venta
        const [rVenta] = await conn.query(
          "INSERT INTO venta (id_pedido, total) VALUES (?, ?)",
          [id, saleTotal]
        );
        ventaId = rVenta.insertId ?? null;

        // Obtener detalles del pedido y crear movimientos de salida para cada producto
        try {
          const detalles = await DetalleModel.listarPorPedido(id);
          if (Array.isArray(detalles) && detalles.length > 0) {
            for (const d of detalles) {
              try {
                // crear movimiento (esto también actualizará el stock en producto)
                await MovimientoModel.crearMovimiento({
                  id_producto: d.id_producto,
                  tipo: "salida",
                  cantidad: Number(d.cantidad) || 0,
                  descripcion: `Salida por venta #${ventaId} (pedido #${id})`
                });
              } catch (errMov) {
                console.error(`Error creando movimiento para detalle ${d.id_detalle_pedido}:`, errMov);
                // no abortamos toda la operación por fallo en un movimiento
              }
            }
          }
        } catch (errDet) {
          console.error("Error al obtener detalles del pedido para crear movimientos:", errDet);
        }
      }
    }
  } catch (e) {
    console.error("Error creando venta/movimientos tras finalizar pedido:", e);
  }

  return { affectedRows: result.affectedRows, ventaId };
}

export async function eliminarPedido(id) {
  const conn = await conexion;
  const [result] = await conn.query("DELETE FROM pedido WHERE id_pedido = ?", [id]);
  return { affectedRows: result.affectedRows };
}

/**
 * Listar pedidos junto con datos del cliente, cantidad de items y total calculado (robusto frente a esquema variable)
 */
export async function listarPedidosConCliente() {
  const conn = await conexion;

  // detectar columna de precio en detalle_pedido (si existe)
  const candidateCols = ["precio", "precio_unitario", "precio_venta", "monto", "valor"];
  let detailPriceCol = null;
  try {
    const placeholders = candidateCols.map(() => "?").join(",");
    const [cols] = await conn.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'detalle_pedido' AND column_name IN (${placeholders})`,
      candidateCols
    );
    if (Array.isArray(cols) && cols.length > 0) detailPriceCol = cols[0].column_name;
  } catch (e) {
    // ignore detection errors
    detailPriceCol = null;
  }

  // detectar columna de precio en producto (fallback)
  const prodCandidates = ["precio_venta", "precio", "precio_unitario", "monto"];
  let prodPriceCol = null;
  try {
    const placeholders = prodCandidates.map(() => "?").join(",");
    const [pcols] = await conn.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'producto' AND column_name IN (${placeholders})`,
      prodCandidates
    );
    if (Array.isArray(pcols) && pcols.length > 0) prodPriceCol = pcols[0].column_name;
  } catch (e) {
    prodPriceCol = null;
  }

  // Construir subquery seguro según columnas detectadas
  let dpSubquery;
  if (detailPriceCol || prodPriceCol) {
    // si hay alguna columna de precio, usar COALESCE(detailPrice, productPrice, 0)
    const dpPriceExprParts = [];
    if (detailPriceCol) dpPriceExprParts.push(`COALESCE(d.${detailPriceCol}, NULL)`);
    if (prodPriceCol) dpPriceExprParts.push(`COALESCE(pr.${prodPriceCol}, NULL)`);
    dpPriceExprParts.push("0");
    const dpPriceExpr = `COALESCE(${dpPriceExprParts.join(", ")})`;

    dpSubquery = `
      SELECT d.id_pedido, COUNT(*) AS items, SUM(d.cantidad * ${dpPriceExpr}) AS total_calc
      FROM detalle_pedido d
      LEFT JOIN producto pr ON COALESCE(pr.id_producto, pr.id) = d.id_producto
      GROUP BY d.id_pedido
    `;
  } else {
    // ninguna columna de precio detectada -> devolver sólo items y total_calc 0
    dpSubquery = `
      SELECT d.id_pedido, COUNT(*) AS items, 0 AS total_calc
      FROM detalle_pedido d
      GROUP BY d.id_pedido
    `;
  }

  // Query principal usando el subquery construido
  const sql = `
    SELECT 
      p.*,
      c.id_cliente AS cliente_id,
      CONCAT(COALESCE(c.nombre,''), ' ', COALESCE(c.apellido,'')) AS cliente_nombre,
      c.email AS cliente_email,
      c.telefono AS cliente_telefono,
      IFNULL(dp.items, 0) AS items,
      IFNULL(dp.total_calc, 0) AS total_calc
    FROM pedido p
    LEFT JOIN cliente c ON p.id_cliente = c.id_cliente
    LEFT JOIN (
      ${dpSubquery}
    ) dp ON dp.id_pedido = p.id_pedido
    ORDER BY p.fecha_pedido DESC
  `;

  // Ejecutar query y normalizar resultados
  const [rows] = await conn.query(sql);
  return rows.map(r => ({
    ...r,
    items: Number(r.items || 0),
    total_calc: Number(r.total_calc || r.total || 0)
  }));
}