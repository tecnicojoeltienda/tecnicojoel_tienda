import { Router } from "express";
import multer from "multer";
import path from "path";
import * as ctrl from "../controllers/cliente.controller.js";

const router = Router();

// Configuración de multer para fotos de perfil
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(process.cwd(), "uploads/")),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `perfil-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpe?g|png|webp|gif)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error("Solo se permiten imágenes"), false);
  }
});

// POST /clientes -> crear cliente (email + clave obligatorios)
router.post("/", ctrl.crear);

// GET /clientes -> listar todos
router.get("/", ctrl.listar);

// GET /clientes/:id -> obtener cliente por id
router.get("/:id", ctrl.buscar);

// PUT /clientes/:id -> actualizar (con soporte para foto)
router.put("/:id", upload.single('foto'), ctrl.actualizar);

export default router;