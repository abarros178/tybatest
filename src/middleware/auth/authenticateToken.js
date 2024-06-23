import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { pool } from "../../db.js";

export const authenticateToken = async (req, res, next) => {
  // Extraer el token del encabezado de autorización y eliminar "Bearer "
  const token = req.header("Authorization")?.replace("Bearer ", "");

  // Verificar si el token está presente
  if (!token) {
    return res.status(401).json({ error: "Access denied" });
  }

  try {
    // Verificar el token JWT usando la clave secreta
    const verified = jwt.verify(token, process.env.KEY_JWT);
    req.user = verified; // Almacenar la información del usuario verificado en req.user
    req.token = token; // Almacenar el token en req.token

    // Obtener la sesión desde la base de datos basada en user_id del token verificado
    const session = await pool.query(
      "SELECT * FROM sessions WHERE user_id = $1",
      [verified.userId]
    );

    // Verificar si se encontró una sesión válida
    if (session.rows.length === 0) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const sessionData = session.rows[0];
    const validToken = await bcrypt.compare(token, sessionData.token_hash);

    // Verificar si el token almacenado en la sesión coincide con el token actual
    if (!validToken) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Verificar si la sesión ha expirado comparando con la fecha actual
    const expirationDate = new Date(sessionData.expires_at);
    if (expirationDate < new Date()) {
      // Si la sesión ha expirado, eliminarla de la base de datos
      await pool.query("DELETE FROM sessions WHERE user_id = $1", [
        verified.userId,
      ]);
      return res
        .status(401)
        .json({ error: "Session has expired. Please log in again." });
    }

    // Si el token es válido y la sesión no ha expirado, pasar al siguiente middleware
    next();
  } catch (err) {
    console.error("Error verificando el token:", err.message);
    return res.status(400).json({ error: "Invalid token" });
  }
};
