import { Router } from "express";
import * as CodigoDescuentoController from "../controllers/codigo_descuento.controller.js";

const router = Router();

// Validar código (público - necesario antes de aplicar)
router.get("/validar/:codigo", CodigoDescuentoController.validar);

// Consumir código (público - se llama al crear pedido)
router.post("/consumir", CodigoDescuentoController.consumir);

// Listar códigos (admin)
router.get("/", CodigoDescuentoController.listar);

export default router;