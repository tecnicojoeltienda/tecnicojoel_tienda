import express from "express";
import cookieParser from "cookie-parser";
import corsMiddleware from "./middleware/cors.js";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import pool from "./config/db.js";

// rutas
import categoriasRouter from "./routes/categoria.route.js";
import productosRouter from "./routes/producto.route.js";
import movimientosRouter from "./routes/movimiento_stock.route.js";
import adminsRouter from "./routes/administrador.route.js";
import authRouter from "./routes/auth.route.js";
import clienteRouter from "./routes/cliente.route.js";
import pedidoRouter from "./routes/pedido.route.js";
import ventaRouter from "./routes/venta.route.js";
import detallePedidoRouter from "./routes/detalle_pedido.route.js";
import codigoDescuentoRoutes from "./routes/codigo_descuento.route.js";
import recuperacionRoutes from "./routes/recuperacion.route.js";

dotenv.config();
const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser()); 
app.use(corsMiddleware);


const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use("/uploads", express.static(uploadsDir));

app.get("/", (req, res) => {
  res.status(200).json({ ok: true, service: "TECNICO JOEL" });
});

// montar rutas API
app.use("/apij/categorias", categoriasRouter);
app.use("/apij/productos", productosRouter);
app.use("/apij/movimientos", movimientosRouter);
app.use("/apij/admins", adminsRouter);
app.use("/apij/auth", authRouter);
app.use("/apij/clientes", clienteRouter);
app.use("/apij/pedidos", pedidoRouter);
app.use("/apij/ventas", ventaRouter);
app.use("/apij/detalle_pedidos", detallePedidoRouter);
app.use("/apij/codigos-descuento", codigoDescuentoRoutes);
app.use("/apij/recuperacion", recuperacionRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

export default app;