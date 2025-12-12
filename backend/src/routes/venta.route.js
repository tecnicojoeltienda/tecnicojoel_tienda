import { Router } from "express";
import * as ctrl from "../controllers/venta.controller.js";

const router = Router();

// GET /apij/ventas
router.get("/", ctrl.listar);
// GET /apij/ventas/:id
router.get("/:id", ctrl.obtener);
// POST /apij/ventas
router.post("/", ctrl.crear);
// PUT /apij/ventas/:id
router.put("/:id", ctrl.actualizar);
// DELETE /apij/ventas/:id
router.delete("/:id", ctrl.eliminar);

export default router;