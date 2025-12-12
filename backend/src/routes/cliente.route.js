import { Router } from "express";
import * as ctrl from "../controllers/cliente.controller.js";

const router = Router();

// POST /clientes -> crear cliente (email + clave obligatorios)
router.post("/", ctrl.crear);

// GET /clientes -> listar todos
router.get("/", ctrl.listar);

// GET /clientes/:id -> obtener cliente por id
router.get("/:id", ctrl.buscar);

// PUT /clientes/:id -> actualizar (nombre, apellido, email)
router.put("/:id", ctrl.actualizar);

export default router;