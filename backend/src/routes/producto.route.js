// ...existing code...
import { Router } from "express";
import express from "express";
import multer from "multer";
import path from "path";
import * as ctrl from "../controllers/producto.controller.js";

const router = Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(process.cwd(), "uploads/")),  // Carpeta de destino
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname.replace(/\s+/g, '_'))); // Nombre del archivo
    }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpe?g|png|webp|gif)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error("Tipo de archivo no soportado"), false);
  }
});

router.get("/", ctrl.listar);
router.get("/:id", ctrl.ver);
router.get("/categoria/:id", ctrl.ListarPorCategoria);
router.get("/categoria/nombre/:name", ctrl.ListarPorCategoriaNombre);
router.post("/", upload.single("imagen"), ctrl.crear);
router.put("/:id", upload.single("imagen"), ctrl.actualizar);
router.delete("/:id", ctrl.eliminar);

export default router;
// ...existing code...