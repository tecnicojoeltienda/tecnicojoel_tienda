import { Router } from "express";
import * as ctrl from "../controllers/cliente.controller.js";

const router = Router();

// POST /clientes -> crear cliente (email + clave obligatorios)
router.post("/", ctrl.crear);

// GET /clientes -> listar todos
router.get("/", ctrl.listar);

// GET /clientes/:id -> obtener cliente por id
router.get("/:id", ctrl.buscar);

// PUT /clientes/:id -> actualizar (con soporte para foto)
router.put("/:id", ctrl.actualizar); // SIN multer, acepta JSON con Base64

export default router;