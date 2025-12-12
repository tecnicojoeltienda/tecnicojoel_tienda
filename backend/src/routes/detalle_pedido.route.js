import { Router } from "express";
import * as ctrl from "../controllers/detalle_pedido.controller.js";

const router = Router();

// GET /apij/detalle_pedidos
router.get("/", ctrl.listar);
// GET /apij/detalle_pedidos/:id
router.get("/:id", ctrl.obtener);
// GET /apij/detalle_pedidos/pedido/:id  -> listar por pedido
router.get("/pedido/:id", ctrl.listarPorPedido);
// POST /apij/detalle_pedidos
router.post("/", ctrl.crear);
// PUT /apij/detalle_pedidos/:id
router.put("/:id", ctrl.actualizar);
// DELETE /apij/detalle_pedidos/:id
router.delete("/:id", ctrl.eliminar);

export default router;