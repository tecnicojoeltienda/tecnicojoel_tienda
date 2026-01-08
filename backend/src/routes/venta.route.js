import { Router } from "express";
import * as ctrl from "../controllers/venta.controller.js";

const router = Router();

// GET /apij/ventas - no requiere auth para ver ventas
router.get("/", ctrl.listar);

// GET /apij/ventas/:id - no requiere auth
router.get("/:id", ctrl.obtener);

// POST /apij/ventas - no requiere auth (quitado middleware)
router.post("/", ctrl.crear);

// PUT /apij/ventas/:id - no requiere auth (quitado middleware)
router.put("/:id", ctrl.actualizar);

// DELETE /apij/ventas/:id - no requiere auth (quitado middleware)
router.delete("/:id", ctrl.eliminar);

export default router;