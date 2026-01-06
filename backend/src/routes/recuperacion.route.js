import express from "express";
import * as ctrl from "../controllers/recuperacion_nodb.controller.js";
const router = express.Router();

router.post("/solicitar", ctrl.solicitar);
router.post("/validar", ctrl.validar);
router.post("/cambiar", ctrl.cambiar);
router.post("/limpiar", ctrl.limpiar); 

export default router;