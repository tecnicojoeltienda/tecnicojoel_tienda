import * as Venta from "../models/venta.model.js";
import * as Detalle from "../models/detalle_pedido.model.js";
import * as Movimiento from "../models/movimiento_stock.model.js";

export async function listar(req, res) {
  try {
    const rows = await Venta.listarVentas();
    return res.json(rows);
  } catch (err) {
    console.error("Error listar ventas:", err);
    return res.status(500).json({ message: "Error al listar ventas" });
  }
}

export async function obtener(req, res) {
  try {
    const id = Number(req.params.id);
    const venta = await Venta.buscarVentaPorId(id);
    if (!venta) return res.status(404).json({ message: "Venta no encontrada" });
    return res.json(venta);
  } catch (err) {
    console.error("Error obtener venta:", err);
    return res.status(500).json({ message: "Error al obtener venta" });
  }
}

export async function crear(req, res) {
  try {
    const { id_pedido, total, metodo_pago } = req.body;
    if (total == null) return res.status(400).json({ message: "total es obligatorio" });

    // crear venta
    const result = await Venta.crearVenta({ id_pedido: id_pedido ?? null, total, metodo_pago: metodo_pago ?? "efectivo" });
    const nuevo = await Venta.buscarVentaPorId(result.insertId);

    // si la venta está vinculada a un pedido, registrar movimientos 'salida' para cada detalle
    if (nuevo && nuevo.id_pedido) {
      try {
        const detalles = await Detalle.listarPorPedido(nuevo.id_pedido);
        if (Array.isArray(detalles) && detalles.length > 0) {
          for (const d of detalles) {
            try {
              await Movimiento.crearMovimiento({
                id_producto: d.id_producto,
                tipo: "salida",
                cantidad: Number(d.cantidad) || 0,
                descripcion: `Salida por venta #${nuevo.id_venta}`
              });
            } catch (errMov) {
              console.error(`No se pudo crear movimiento para detalle ${d.id_detalle_pedido}:`, errMov);
              // no abortar toda la operación por fallo en movimiento
            }
          }
        }
      } catch (errDet) {
        console.error("Error al obtener detalles del pedido para crear movimientos:", errDet);
      }
    }

    return res.status(201).json(nuevo);
  } catch (err) {
    console.error("Error crear venta:", err);
    return res.status(500).json({ message: "Error al crear venta" });
  }
}

export async function actualizar(req, res) {
  try {
    const id = Number(req.params.id);
    const existing = await Venta.buscarVentaPorId(id);
    if (!existing) return res.status(404).json({ message: "Venta no encontrada" });
    const cambios = req.body;
    const result = await Venta.actualizarVenta(id, cambios);
    if (result.affectedRows === 0) return res.status(400).json({ message: "No se realizó ningún cambio" });
    const updated = await Venta.buscarVentaPorId(id);
    return res.json(updated);
  } catch (err) {
    console.error("Error actualizar venta:", err);
    return res.status(500).json({ message: "Error al actualizar venta" });
  }
}

export async function eliminar(req, res) {
  try {
    const id = Number(req.params.id);
    const existing = await Venta.buscarVentaPorId(id);
    if (!existing) return res.status(404).json({ message: "Venta no encontrada" });
    const result = await Venta.eliminarVenta(id);
    return res.json({ deleted: result.affectedRows === 1 });
  } catch (err) {
    console.error("Error eliminar venta:", err);
    return res.status(500).json({ message: "Error al eliminar venta" });
  }
}