import pg from "pg";
import {
  DB_DATABASE,
  DB_HOST,
  DB_PASSWORD,
  DB_PORT,
  DB_USER,
} from "./config.js";

export const pool = new pg.Pool({
  user: DB_USER,
  host: DB_HOST,
  password: DB_PASSWORD,
  database: DB_DATABASE,
  port: DB_PORT,
});


// Función para verificar la conexión a la base de datos
async function verifyDatabaseConnection() {
  try {
    const client = await pool.connect();
    console.log("Connected to the database successfully.");
    client.release();
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1); // Finaliza la aplicación si no se puede conectar a la base de datos
  }
}

// Verificar la conexión a la base de datos
verifyDatabaseConnection();