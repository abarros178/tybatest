import { pool } from "../../db.js";

export const registerLogoutTransaction = async (
  userId,
  action,
  data = null
) => {
  try {
    let dataToInsert = data;
    // Verificar si data no es null y convertir a JSON solo en ese caso
    if (data !== null) {
      dataToInsert = JSON.stringify(data);
    }

    await pool.query(
      "INSERT INTO transactions (user_id, action_id, data) VALUES ($1, $2, $3)",
      [userId, action, dataToInsert]
    );
    console.log(`Transaction recorded for user ${userId}: Action - ${action}`);
  } catch (error) {
    console.error("Error recording transaction:", error.message);
    throw error; // Puedes manejar el error según tus necesidades
  }
};

// Función para verificar la validez de un correo electrónico
export const isValidEmail = (email) => {
  // Patrón simple para verificar el formato del correo electrónico
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Función para obtener el ID de la acción por nombre
export const getActionIdByName = async (actionName) => {
  try {
    const result = await pool.query("SELECT id FROM actions WHERE name = $1", [
      actionName,
    ]);
    return result.rows.length > 0 ? result.rows[0].id : null;
  } catch (error) {
    console.error("Error fetching action ID:", error.message);
    throw error;
  }
};
