import fs from "fs";
import path from "path";
import * as model from "../models/producto.model.js";
import * as Movimiento from "../models/movimiento_stock.model.js";

export async function listar(req, res) {
  try {
    const rows = await model.obtenerProductos();
    return res.status(200).json(rows);
  } catch (e) {
    console.error("ERROR listar productos:", e);
    return res.status(500).json({ error: e.message || "Error al listar productos" });
  }
}

export async function ver(req, res) {
  try {
    const row = await model.obtenerProductoPorId(req.params.id);
    if (!row) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    return res.status(200).json(row);
  } catch (e) {
    console.error("ERROR ver producto:", e);
    return res.status(500).json({ error: "Error al obtener producto" });
  }
}

async function saveBase64Image(dataUrl, originalFilename = "image.jpg") {
  const matches = dataUrl.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
  if (!matches) throw new Error("Invalid base64 image data");
  
  const base64 = matches[2];
  const buffer = Buffer.from(base64, "base64");
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  
  const filepath = path.join(uploadsDir, originalFilename);
  await fs.promises.writeFile(filepath, buffer);
  return `/uploads/${originalFilename}`;
}

export async function crear(req, res) {
  try {
    const data = { ...req.body };
    
    console.log("📦 Datos recibidos para crear producto:", JSON.stringify(data, null, 2));

    // Procesar imagen de archivo
    if (req.file) {
      const originalName = req.file.originalname;
      const uploadsDir = path.join(process.cwd(), "uploads");
      const oldPath = req.file.path;
      const newPath = path.join(uploadsDir, originalName);
      await fs.promises.rename(oldPath, newPath);
      data.imagen_url = `/uploads/${originalName}`;
    } 
    // Procesar imagen base64
    else if (data.imagen_url && typeof data.imagen_url === "string" && data.imagen_url.startsWith("data:")) {
      try {
        let originalFilename = data.imagen_nombre || data.imagen_filename;
        if (!originalFilename) {
          const matches = data.imagen_url.match(/^data:(image\/[a-zA-Z]+);base64,/);
          const ext = matches ? (matches[1].split("/")[1] === "jpeg" ? "jpg" : matches[1].split("/")[1]) : "jpg";
          const slug = (data.nombre_producto || "producto").toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\w\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-');
          originalFilename = `${slug}.${ext}`;
        }
        data.imagen_url = await saveBase64Image(data.imagen_url, originalFilename);
      } catch (err) {
        console.error("Error saving base64 image:", err.message);
        return res.status(400).json({ error: `Error en imagen base64: ${err.message}` });
      }
    }

    // Crear producto
    const result = await model.crearProducto(data);
    const nuevoId = result.insertId || result.id;

    console.log("✅ Producto creado con ID:", nuevoId);

    // Procesar productos relacionados (solo log, se guarda en localStorage del frontend)
    if (data.productos_relacionados) {
      try {
        const relacionados = typeof data.productos_relacionados === 'string' 
          ? JSON.parse(data.productos_relacionados) 
          : data.productos_relacionados;
        console.log("📦 Productos relacionados recibidos:", relacionados);
      } catch (e) {
        console.log("⚠️ No se pudieron procesar productos relacionados:", e.message);
      }
    }

    return res.status(201).json({ id: nuevoId, message: "Producto creado exitosamente" });
  } catch (e) {
    console.error("ERROR crear producto:", e.stack || e.message || e);
    return res.status(500).json({ error: `Error al crear producto: ${e.message}` });
  }
}

export async function actualizar(req, res) {
  try {
    const data = { ...req.body };
    const idProducto = Number(req.params.id);

    console.log("📝 Actualizando producto ID:", idProducto);
    console.log("📦 Datos recibidos:", JSON.stringify(data, null, 2));

    // Verificar que el producto existe
    const existing = await model.obtenerProductoPorId(idProducto);
    if (!existing) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    // Procesar imagen de archivo
    if (req.file) {
      const originalName = req.file.originalname;
      const uploadsDir = path.join(process.cwd(), "uploads");
      const oldPath = req.file.path;
      const newPath = path.join(uploadsDir, originalName);
      await fs.promises.rename(oldPath, newPath);
      data.imagen_url = `/uploads/${originalName}`;
    } 
    // Procesar imagen base64
    else if (data.imagen_url && typeof data.imagen_url === "string" && data.imagen_url.startsWith("data:")) {
      try {
        const originalFilename = data.imagen_nombre || data.imagen_filename || "image.jpg";
        data.imagen_url = await saveBase64Image(data.imagen_url, originalFilename);
      } catch (err) {
        console.error("Error saving base64 image (update):", err.message);
        return res.status(400).json({ error: "Error en imagen base64" });
      }
    }

    // Manejo de stock con movimientos
    let stockProvided = false;
    let newStock = null;

    if ("stock" in data) {
      stockProvided = true;
      newStock = Number(data.stock);
    }

    let delta = 0;
    if (stockProvided && existing) {
      delta = newStock - (Number(existing.stock) || 0);
      delete data.stock; // No actualizar directamente, usar movimientos
    }

    // Actualizar producto
    const affected = await model.actualizarProducto(req.params.id, data);

    // Crear movimiento de stock si hay cambios
    if (stockProvided && existing && delta !== 0) {
      try {
        const tipo = delta > 0 ? "entrada" : "salida";
        const cantidad = Math.abs(Math.trunc(delta));
        if (cantidad > 0) {
          await Movimiento.crearMovimiento({
            id_producto: idProducto,
            tipo,
            cantidad,
            descripcion: `Ajuste manual (${tipo}) - producto ${idProducto}`
          });
          console.log(`✅ Movimiento de stock creado: ${tipo} de ${cantidad} unidades`);
        }
      } catch (errMov) {
        console.error("Error creando movimiento de stock:", errMov);
      }
    }

    // Procesar productos relacionados
    if (data.productos_relacionados) {
      try {
        const relacionados = typeof data.productos_relacionados === 'string' 
          ? JSON.parse(data.productos_relacionados) 
          : data.productos_relacionados;
        
        console.log("📦 Productos relacionados recibidos para actualizar:", relacionados);
      } catch (e) {
        console.log("⚠️ No se pudieron procesar productos relacionados:", e.message);
      }
    }

    console.log("✅ Producto actualizado exitosamente");
    return res.status(200).json({ affected, id: idProducto, message: "Producto actualizado exitosamente" });
  } catch (e) {
    console.error("ERROR actualizar producto:", e.stack || e.message || e);
    return res.status(500).json({ error: `Error al actualizar producto: ${e.message}` });
  }
}

export async function eliminar(req, res) {
  try {
    const affected = await model.eliminarProducto(req.params.id);
    if (affected === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    return res.status(200).json({ affected, message: "Producto eliminado exitosamente" });
  } catch (e) {
    console.error("ERROR eliminar producto:", e);
    return res.status(500).json({ error: "Error al eliminar producto" });
  }
}

export async function ListarPorCategoria(req, res) {
  try {
    const id_categoria = req.params.id;
    const productos = await model.obtenerProductosPorCategoria(id_categoria);
    return res.status(200).json(productos);
  } catch (err) {
    console.error("ERROR listar por categoría:", err);
    return res.status(500).json({ error: "Error al obtener productos por categoría" });
  }
}

export async function ListarPorCategoriaNombre(req, res) {
  try {
    const nombre = req.params.name;
    const productos = await model.obtenerProductosPorNombreCategoria(nombre);
    return res.status(200).json(productos);
  } catch (err) {
    console.error("ERROR listar por nombre de categoría:", err);
    return res.status(500).json({ error: "Error al obtener productos por nombre de categoría" });
  }
}