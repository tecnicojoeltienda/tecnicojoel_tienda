import { Router } from "express";
import * as ctrl from "../controllers/venta.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = Router();

// GET /apij/ventas - no requiere auth para ver ventas
router.get("/", ctrl.listar);

// GET /apij/ventas/:id - no requiere auth
router.get("/:id", ctrl.obtener);

// POST /apij/ventas - requiere auth para crear
router.post("/", authMiddleware, ctrl.crear);

// PUT /apij/ventas/:id - requiere auth para editar
router.put("/:id", authMiddleware, ctrl.actualizar);

// DELETE /apij/ventas/:id - requiere auth para eliminar
router.delete("/:id", authMiddleware, ctrl.eliminar);

export default router;