
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// Crear una conexión (no pool) y exportarla como `conexion`.
// Nota: `mysql.createConnection(...)` devuelve una Promise, así que `conexion` será una Promise
// que resuelve a la conexión. En los módulos que la consuman debes `await`arla.
export const conexion = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
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
