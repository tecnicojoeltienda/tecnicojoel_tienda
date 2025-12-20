import fs from "fs";
import path from "path";
import * as model from "../models/producto.model.js";
import * as Movimiento from "../models/movimiento_stock.model.js";

export async function listar(req, res) {
  try {
    const rows = await model.obtenerProductos();
    res.json(rows);
  } catch (e) {
    console.error("ERROR DETALLADO:", e); 
    res.status(500).json({ error: "Error al listar productos", mensaje: e.message });
  }
}

export async function ver(req, res) {
  try {
    const row = await model.obtenerProductoPorId(req.params.id);
    if (!row) return res.status(404).json({ error: "Producto no encontrado" });
    res.json(row);
  } catch (e) {
    res.status(500).json({ error: "Error al obtener producto" });
  }
}

async function saveBase64Image(dataUrl, originalFilename = "image.jpg") {
  const matches = dataUrl.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
  if (!matches) throw new Error("Invalid base64 image data");
  
  const base64 = matches[2];
  const buffer = Buffer.from(base64, "base64");
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  
  // Usar el nombre original del archivo
  const filepath = path.join(uploadsDir, originalFilename);
  
  await fs.promises.writeFile(filepath, buffer);
  return `/uploads/${originalFilename}`;
}

export async function crear(req, res) {
  try {
    const data = { ...req.body };
    
    console.log("📦 Datos recibidos:", JSON.stringify(data, null, 2));

    if (req.file) {
      
      const originalName = req.file.originalname;
      const uploadsDir = path.join(process.cwd(), "uploads");
      const oldPath = req.file.path;
      const newPath = path.join(uploadsDir, originalName);
      
      
      await fs.promises.rename(oldPath, newPath);
      
      data.imagen_url = `/uploads/${originalName}`;
    } else if (data.imagen_url && typeof data.imagen_url === "string" && data.imagen_url.startsWith("data:")) {
      
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
        return res.status(400).json({ error: "Imagen en formato base64 inválida", detalle: err.message });
      }
    }

    const result = await model.crearProducto(data);
    const nuevoId = result.insertId || id;

    // Guardar productos relacionados si vienen
    if (data.productos_relacionados) {
      try {
        const relacionados = JSON.parse(data.productos_relacionados);
        // Aquí podrías guardar en una tabla, pero por ahora solo retornamos el ID
        // para que el frontend los guarde en localStorage
      } catch (e) {
        console.log("No se pudieron procesar productos relacionados");
      }
    }

    res.status(201).json({ ok: true, id: nuevoId });
  } catch (e) {
    console.error("ERROR crear producto COMPLETO:", e.stack || e.message || e);
    res.status(500).json({ error: "Error al crear producto", detalle: e.message });
  }
}

export async function actualizar(req, res) {
  try {
    const data = { ...req.body };

    // Obtener el producto existente
    const idProducto = Number(req.params.id);
    const existing = await model.obtenerProductoPorId(idProducto);
    if (!existing) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    if (req.file) {
      // Archivo subido vía multipart - USAR EL NOMBRE ORIGINAL
      const originalName = req.file.originalname;
      const uploadsDir = path.join(process.cwd(), "uploads");
      const oldPath = req.file.path;
      const newPath = path.join(uploadsDir, originalName);
      
      // Renombrar el archivo temporal al nombre original
      await fs.promises.rename(oldPath, newPath);
      
      data.imagen_url = `/uploads/${originalName}`;
    } else if (data.imagen_url && typeof data.imagen_url === "string" && data.imagen_url.startsWith("data:")) {
      // Base64 image - necesitamos el nombre original del archivo
      try {
        const originalFilename = data.imagen_nombre || data.imagen_filename || "image.jpg";
        data.imagen_url = await saveBase64Image(data.imagen_url, originalFilename);
      } catch (err) {
        console.error("Error saving base64 image (update):", err.message);
        return res.status(400).json({ error: "Imagen en formato base64 inválida" });
      }
    }

    // Manejo de stock: calcular delta y siempre crear movimiento si delta != 0.
    let stockProvided = false;
    let newStock = null;

    if ("stock" in data) {
      stockProvided = true;
      newStock = Number(data.stock);
    }

    let delta = 0;
    if (stockProvided && existing) {
      delta = newStock - (Number(existing.stock) || 0);
      delete data.stock;
    }

    const affected = await model.actualizarProducto(req.params.id, data);

    if (stockProvided && existing && delta !== 0) {
      try {
        const tipo = delta > 0 ? "entrada" : "salida";
        const cantidad = Math.abs(Math.trunc(delta));
        if (cantidad > 0) {
          await Movimiento.crearMovimiento({
            id_producto: idProducto,
            tipo,
            cantidad,
            descripcion: `Ajuste de stock manual (${tipo}) - producto ${idProducto}`
          });
        }
      } catch (errMov) {
        console.error("Error creando movimiento tras actualizar stock:", errMov);
      }
    }

    // ✅ Procesar productos relacionados si vienen en el request
    if (data.productos_relacionados) {
      try {
        const relacionados = typeof data.productos_relacionados === 'string' 
          ? JSON.parse(data.productos_relacionados) 
          : data.productos_relacionados;
        
        console.log("📦 Productos relacionados recibidos para actualizar:", relacionados);
        
        // Aquí podrías guardar en una tabla si la tienes
        // Por ahora solo logueamos que se recibieron correctamente
        
      } catch (e) {
        console.log("⚠️ No se pudieron procesar productos relacionados en actualización:", e.message);
      }
    }

    return res.json({ ok: true, affected });
  } catch (e) {
    console.error("ERROR actualizar producto:", e && (e.stack || e.message || e));
    res.status(500).json({ error: "Error al actualizar producto" });
  }
}

export async function eliminar(req, res) {
  try {
    const affected = await model.eliminarProducto(req.params.id);
    res.json({ ok: true, affected });
  } catch (e) {
    res.status(500).json({ error: "Error al eliminar producto" });
  }
}


export async function ListarPorCategoria(req, res) {
  const id_categoria = req.params.id;
  try {
    const productos = await model.obtenerProductosPorCategoria(id_categoria);
    return res.status(200).json(productos);
  } catch (err) {
    console.error("porCategoria:", err);
    return res.status(500).json({ error: "Error al obtener productos por categoría" });
  }
}

export async function ListarPorCategoriaNombre(req, res) {
  const nombre = req.params.name;
  try {
    const productos = await model.obtenerProductosPorNombreCategoria(nombre);
    return res.status(200).json(productos);
  } catch (err) {
    console.error("porCategoriaNombre:", err);
    return res.status(500).json({ error: "Error al obtener productos por nombre de categoría" });
  }
}