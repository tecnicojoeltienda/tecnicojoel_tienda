import { Router } from "express";
import * as ctrl from "../controllers/administrador.controller.js";

const router = Router();

router.get("/", ctrl.listar);
router.post("/", ctrl.crear);

// Estadísticas
router.get("/estadisticas", ctrl.estadisticas);

// Actualizar admin (password / rol / estado / email)
router.put("/:id", ctrl.actualizar);

export default router;