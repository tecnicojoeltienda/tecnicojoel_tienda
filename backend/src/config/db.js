import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// --- AGREGA ESTO PARA VERIFICAR ---
console.log("Intentando conectar a:", {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    db: process.env.DB_NAME
});
// ----------------------------------

export const conexion = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,  
  ssl: {
    rejectUnauthorized: false 
  }
});

conexion
  .then((conn) => {
    console.log("Conexión a la base de datos exitosa");
    // Mantener la conexión abierta para reutilizarla desde otros módulos
  })
  .catch((error) => {
    console.error("Error de conexión a la base de datos:", error);
  });

export default conexion;