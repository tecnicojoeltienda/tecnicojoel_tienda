import fs from "fs";
import path from "path";
import * as model from "../models/producto.model.js";
import * as Movimiento from "../models/movimiento_stock.model.js";
import * as ProductoRelacionado from "../models/producto_relacionado.model.js";

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

    // Extraer productos relacionados antes de crear
    let productosRelacionados = [];
    if (data.productos_relacionados) {
      try {
        productosRelacionados = typeof data.productos_relacionados === 'string' 
          ? JSON.parse(data.productos_relacionados) 
          : data.productos_relacionados;
        
        // Normalizar a números y filtrar valores inválidos
        productosRelacionados = productosRelacionados
          .map(id => Number(id))
          .filter(id => !isNaN(id) && id > 0);
        
        delete data.productos_relacionados; // No enviar a la tabla producto
        
        console.log("✅ Productos relacionados procesados:", productosRelacionados);
      } catch (e) {
        console.log("⚠️ No se pudieron procesar productos relacionados:", e.message);
        productosRelacionados = [];
      }
    }

    // Si no envían precio_lista usar precio_venta como valor por defecto
    if (data.precio_lista == null && data.precio_venta != null) {
      data.precio_lista = data.precio_venta;
    }

    // Crear producto
    const result = await model.crearProducto(data);
    const nuevoId = result.insertId || result.id;

    console.log("✅ Producto creado con ID:", nuevoId);

    // Guardar productos relacionados en la base de datos
    if (productosRelacionados.length > 0) {
      try {
        const resultRel = await ProductoRelacionado.guardarProductosRelacionados(nuevoId, productosRelacionados);
        console.log(`✅ ${resultRel.count} productos relacionados guardados para producto ${nuevoId}`);
      } catch (err) {
        console.error("❌ Error guardando productos relacionados:", err);
        // No fallar la operación completa si falla esto
      }
    } else {
      console.log("ℹ️ No hay productos relacionados para guardar");
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

    // Extraer productos relacionados antes de actualizar
    let productosRelacionados = [];
    if (data.productos_relacionados) {
      try {
        productosRelacionados = typeof data.productos_relacionados === 'string' 
          ? JSON.parse(data.productos_relacionados) 
          : data.productos_relacionados;
        
        // Normalizar a números y filtrar valores inválidos
        productosRelacionados = productosRelacionados
          .map(id => Number(id))
          .filter(id => !isNaN(id) && id > 0);
        
        delete data.productos_relacionados; // No enviar a la tabla producto
        
        console.log("✅ Productos relacionados procesados para actualizar:", productosRelacionados);
      } catch (e) {
        console.log("⚠️ No se pudieron procesar productos relacionados:", e.message);
        productosRelacionados = [];
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
            descripcion: `Ajuste manual (${tipo}) - producto ${idProducto}`
          });
          console.log(` Movimiento de stock creado: ${tipo} de ${cantidad} unidades`);
          
         
          if (newStock <= 0) {
            await model.actualizarProducto(idProducto, { estado: 'agotado' });
            console.log(` Producto ${idProducto} marcado como agotado (stock: ${newStock})`);
          } else if (existing.estado === 'agotado' && newStock > 0) {
            await model.actualizarProducto(idProducto, { estado: 'disponible' });
            console.log(` Producto ${idProducto} marcado como disponible (stock: ${newStock})`);
          }
        }
      } catch (errMov) {
        console.error("Error creando movimiento de stock:", errMov);
      }
    }

    // Actualizar productos relacionados en la base de datos (siempre, incluso si está vacío)
    try {
      const resultRel = await ProductoRelacionado.guardarProductosRelacionados(idProducto, productosRelacionados);
      console.log(` Productos relacionados actualizados para producto ${idProducto}: ${resultRel.count} relaciones`);
    } catch (err) {
      console.error(" Error actualizando productos relacionados:", err);
      // No fallar la operación completa si falla esto
    }

    console.log(" Producto actualizado exitosamente");
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

// ✅ NUEVA FUNCIÓN: Obtener productos relacionados de un producto
export async function obtenerRelacionados(req, res) {
  try {
    const idProducto = req.params.id;
    const relacionados = await ProductoRelacionado.obtenerProductosRelacionados(idProducto);
    return res.status(200).json(relacionados);
  } catch (err) {
    console.error("ERROR obtener productos relacionados:", err);
    return res.status(500).json({ error: "Error al obtener productos relacionados" });
  }
}

// Añadir al final del archivo, antes del export
export async function verificarStock(req, res) {
  try {
    const idProducto = req.params.id;
    const producto = await model.obtenerProductoPorId(idProducto);
    
    if (!producto) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    return res.status(200).json({
      id_producto: producto.id_producto,
      stock: producto.stock || 0,
      estado: producto.estado,
      disponible: (producto.stock > 0 && producto.estado !== 'agotado')
    });
  } catch (err) {
    console.error("ERROR verificar stock:", err);
    return res.status(500).json({ error: "Error al verificar stock" });
  }
}

// En producto.controller.js
export const buscarPorSlug = async (req, res) => {
  try {
    const slug = req.params.slug;
    const result = await pool.query(
      `SELECT p.*, c.nombre AS categoria
       FROM productos p
       LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
       WHERE LOWER(REPLACE(REPLACE(NORMALIZE(p.nombre_producto, NFD), ' ', '-'), 'á', 'a')) = $1
       OR CAST(p.id_producto AS TEXT) = $1`,
      [slug.toLowerCase()]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error buscando producto por slug:", error);
    res.status(500).json({ message: "Error al buscar producto" });
  }
};