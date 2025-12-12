// ...existing code...
import { Router } from "express";
import * as ctrl from "../controllers/movimiento_stock.controller.js";

const router = Router();

router.get("/", ctrl.listar);
router.get("/:id", ctrl.ver);
router.post("/", ctrl.crear);
router.delete("/:id", ctrl.eliminar);

export default router;
// ...existing code...