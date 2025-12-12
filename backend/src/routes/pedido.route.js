import { Router } from "express";
import * as ctrl from "../controllers/pedido.controller.js";

const router = Router();

// GET /apij/pedidos
router.get("/", ctrl.listar);
// GET /apij/pedidos/con-clientes
router.get("/con-clientes", ctrl.listarConCliente);
// GET /apij/pedidos/:id
router.get("/:id", ctrl.obtener);
// POST /apij/pedidos
router.post("/", ctrl.crear);
// PUT /apij/pedidos/:id
router.put("/:id", ctrl.actualizar);
// DELETE /apij/pedidos/:id
router.delete("/:id", ctrl.eliminar);

export default router;