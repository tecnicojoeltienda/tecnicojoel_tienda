import fs from "fs";
import path from "path";
import * as model from "../models/producto.model.js";
import * as Movimiento from "../models/movimiento_stock.model.js";

export async function listar(req, res) {
  try {
    const rows = await model.obtenerProductos();
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Error al listar productos" });
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

async function saveBase64Image(dataUrl) {
  const matches = dataUrl.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
  if (!matches) throw new Error("Invalid base64 image data");
  const mime = matches[1]; // e.g. image/png
  const ext = mime.split("/")[1] === "jpeg" ? "jpg" : mime.split("/")[1];
  const base64 = matches[2];
  const buffer = Buffer.from(base64, "base64");
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  const filename = `${Date.now()}-${Math.round(Math.random()*1e9)}.${ext}`;
  const filepath = path.join(uploadsDir, filename);
  await fs.promises.writeFile(filepath, buffer);
  return `/uploads/${filename}`;
}

export async function crear(req, res) {
  try {
    const data = { ...req.body };

    if (req.file && req.file.filename) {
      data.imagen_url = `/uploads/${req.file.filename}`;
    } else if (data.imagen_url && typeof data.imagen_url === "string" && data.imagen_url.startsWith("data:")) {
      try {
        data.imagen_url = await saveBase64Image(data.imagen_url);
      } catch (err) {
        console.error("Error saving base64 image:", err.message);
        return res.status(400).json({ error: "Imagen en formato base64 inválida" });
      }
    }

    // No parsear JSON: aceptar string/array/objeto y dejar que el modelo lo convierta a texto plano
    const id = await model.crearProducto(data);
    res.status(201).json({ ok: true, id });
  } catch (e) {
    console.error("ERROR crear producto:", e && (e.stack || e.message || e));
    res.status(500).json({ error: "Error al crear producto" });
  }
}

export async function actualizar(req, res) {
  try {
    const data = { ...req.body };

    if (req.file && req.file.filename) {
      data.imagen_url = `/uploads/${req.file.filename}`;
    } else if (data.imagen_url && typeof data.imagen_url === "string" && data.imagen_url.startsWith("data:")) {
      try {
        data.imagen_url = await saveBase64Image(data.imagen_url);
      } catch (err) {
        console.error("Error saving base64 image (update):", err.message);
        return res.status(400).json({ error: "Imagen en formato base64 inválida" });
      }
    }

    // Manejo de stock: calcular delta y siempre crear movimiento si delta != 0.
    const idProducto = Number(req.params.id);
    let existing = null;
    let stockProvided = false;
    let newStock = null;

    if ("stock" in data) {
      stockProvided = true;
      newStock = Number(data.stock);
      existing = await model.obtenerProductoPorId(idProducto);
      if (!existing) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }
    }

    let delta = 0;
    if (stockProvided && existing) {
      delta = newStock - (Number(existing.stock) || 0);
      // Quitamos stock del objeto 'data' para que la actualización no escriba el valor directamente.
      // Dejamos que el movimiento ajuste el stock (crearMovimiento hace la suma/resta).
      delete data.stock;
    }

    // actualizar otros campos (sin stock si lo quitamos)
    const affected = await model.actualizarProducto(req.params.id, data);

    // si detectamos cambio en stock (delta != 0), crear movimiento correspondiente
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
        // no abortamos la respuesta principal
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