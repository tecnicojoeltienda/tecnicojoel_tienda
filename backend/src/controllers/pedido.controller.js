import * as Pedido from "../models/pedido.model.js";
import * as CodigoDescuento from "../models/codigo_descuento.model.js";

export async function listar(req, res) {
  try {
    const rows = await Pedido.listarPedidos();
    return res.json(rows);
  } catch (err) {
    console.error("Error listar pedidos:", err);
    return res.status(500).json({ message: "Error al listar pedidos" });
  }
}

export async function obtener(req, res) {
  try {
    const id = Number(req.params.id);
    const pedido = await Pedido.buscarPedidoPorId(id);
    if (!pedido) return res.status(404).json({ message: "Pedido no encontrado" });
    return res.json(pedido);
  } catch (err) {
    console.error("Error obtener pedido:", err);
    return res.status(500).json({ message: "Error al obtener pedido" });
  }
}

export async function crear(req, res) {
  try {
    const { id_cliente, estado, total, codigo_descuento, porcentaje_descuento } = req.body;
    if (id_cliente == null) {
      return res.status(400).json({ message: "id_cliente es obligatorio" });
    }
    const result = await Pedido.crearPedido({
      id_cliente,
      estado,
      total: total ?? 0.0,
      codigo_descuento: codigo_descuento ?? null,
      porcentaje_descuento: porcentaje_descuento ?? null
    });
    const nuevo = await Pedido.buscarPedidoPorId(result.insertId);
    return res.status(201).json(nuevo);
  } catch (err) {
    console.error("Error crear pedido:", err);
    return res.status(500).json({ message: "Error al crear pedido" });
  }
}

export async function actualizar(req, res) {
  try {
    const id = Number(req.params.id);
    const cambios = req.body;
    const existing = await Pedido.buscarPedidoPorId(id);
    if (!existing) return res.status(404).json({ message: "Pedido no encontrado" });

    const result = await Pedido.actualizarPedido(id, cambios);
    if (result.affectedRows === 0) return res.status(400).json({ message: "No se realizó ningún cambio" });

    const updated = await Pedido.buscarPedidoPorId(id);

    const newEstado = String(cambios.estado ?? updated.estado ?? "").toLowerCase();
    if (["cancelado", "cancelar", "canceled", "cancel"].includes(newEstado)) {
      if (existing.codigo_descuento) {
        try {
          await CodigoDescuento.liberarCodigo(existing.codigo_descuento);
          console.log(`Código ${existing.codigo_descuento} liberado por pedido #${id}`);
        } catch (errCd) {
          console.error("Error al devolver código tras cancelar pedido:", errCd);
        }
      }
    }

    return res.json(updated);
  } catch (err) {
    console.error("Error actualizar pedido:", err);
    return res.status(500).json({ message: "Error al actualizar pedido" });
  }
}

export async function eliminar(req, res) {
  try {
    const id = Number(req.params.id);
    const existing = await Pedido.buscarPedidoPorId(id);
    if (!existing) return res.status(404).json({ message: "Pedido no encontrado" });

    const result = await Pedido.eliminarPedido(id);
    const deleted = result.affectedRows === 1;

    if (deleted && existing.codigo_descuento) {
      try {
        await CodigoDescuento.liberarCodigo(existing.codigo_descuento);
        console.log(`Código ${existing.codigo_descuento} liberado tras eliminar pedido #${id}`);
      } catch (errCd) {
        console.error("Error al devolver código tras eliminar pedido:", errCd);
      }
    }

    return res.json({ deleted });
  } catch (err) {
    console.error("Error eliminar pedido:", err);
    return res.status(500).json({ message: "Error al eliminar pedido" });
  }
}

/**
 * Lista pedidos con datos del cliente y resumen (items, total calculado)
 * GET /apij/pedidos/con-clientes
 */
export async function listarConCliente(req, res) {
  try {
    const rows = await Pedido.listarPedidosConCliente();
    return res.json(rows);
  } catch (err) {
    console.error("Error listar pedidos con cliente:", err);
    return res.status(500).json({ message: "Error al listar pedidos con cliente" });
  }
}