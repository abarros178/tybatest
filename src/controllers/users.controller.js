import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import axios from "axios";
import {
  registerLogoutTransaction,
  isValidEmail,
  getActionIdByName,
} from "./helpers/fuctionsHelps.js";

// Función de registro de usuario
export const register = async (req, res) => {
  try {
    // Extracción de datos de usuario del cuerpo de la solicitud
    const { username, email, password } = req.body;

    // Verificación de datos de entrada
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ error: "Username, email, and password are required" });
    }

    // Verificación de la longitud del nombre de usuario
    if (username.length < 3 || username.length > 50) {
      return res
        .status(400)
        .json({ error: "Username must be between 3 and 50 characters long" });
    }

    // Verificación de la validez del correo electrónico
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Invalid email address" });
    }

    // Verificación de la contraseña
    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters long" });
    }

    // Verificación si el usuario ya existe en la base de datos por username
    const existingUserByUsername = await pool.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );
    if (existingUserByUsername.rows.length > 0) {
      return res.status(400).json({ error: "Username already exists" });
    }

    // Verificación si el usuario ya existe en la base de datos
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // Hash de la contraseña utilizando bcrypt para un almacenamiento seguro
    const hashedPassword = await bcrypt.hash(password, 10);

    // Preparación de la consulta SQL para insertar datos de usuario en la tabla "usuarios"
    const newUser = await pool.query(
      "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *",
      [username, email, hashedPassword]
    );

    // Verificación si la creación del usuario fue exitosa
    if (newUser.rows.length > 0) {
      // Devolución de la información del usuario recién creado
      res.status(201).json(newUser.rows[0]);
    } else {
      // Manejo del fallo en la creación del usuario (p. ej., nombre de usuario o correo electrónico ya existe)
      res.status(500).json({ error: "Failed to create user" });
    }
  } catch (error) {
    // Captura de cualquier error y respuesta con un estado 500
    console.error("Error registering user:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Función de inicio de sesión de usuario
export const login = async (req, res) => {
  const defaultTimeExp = "1h";
  // Extracción del nombre de usuario y la contraseña del cuerpo de la solicitud
  const { username, password } = req.body;

  // Consulta de la tabla "usuarios" para encontrar el usuario con el nombre de usuario proporcionado
  const user = await pool.query("SELECT * FROM users WHERE username = $1", [
    username,
  ]);

  // Verificación si existe un usuario con el nombre de usuario proporcionado
  if (user.rows.length === 0) {
    // Devolución de un error indicando credenciales inválidas
    return res.status(400).json({ error: "Invalid username or password" });
  }

  // Consultar si hay una sesión activa para el usuario en la tabla "sessions"
  const activeSession = await pool.query(
    "SELECT * FROM sessions WHERE user_id = $1",
    [user.rows[0].id]
  );

  // Si hay una sesión activa, devolver un mensaje indicando que ya hay un token generado
  if (activeSession.rows.length > 0) {
    return res.status(200).json({ message: "Session already active" });
  }

  // Extracción de la contraseña con hash del registro de la base de datos
  const hashedPassword = user.rows[0].password;

  // Comparación de la contraseña proporcionada con la contraseña con hash utilizando bcrypt
  const validPassword = await bcrypt.compare(password, hashedPassword);

  // Verificación si la contraseña proporcionada coincide con la contraseña con hash almacenada
  if (!validPassword) {
    // Devolución de un error indicando credenciales inválidas
    return res.status(400).json({ error: "Invalid username or password" });
  }

  // Generación de un Token Web JSON (JWT) que contiene el ID de usuario
  const token = jwt.sign({ userId: user.rows[0].id }, process.env.KEY_JWT, {
    expiresIn: defaultTimeExp,
  });

  // Hash del JWT generado para mayor seguridad
  const tokenHash = await bcrypt.hash(token, 10);

  const expirationDate = new Date();
  expirationDate.setHours(expirationDate.getHours() + 1);

  await pool.query(
    "INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
    [user.rows[0].id, tokenHash, expirationDate]
  );

  const idLogin = await getActionIdByName("User Login");

  // Registro de la transacción de logout llamando a la función separada
  await registerLogoutTransaction(user.rows[0].id, idLogin);

  // Devolución del JWT generado al cliente
  res.status(201).json({ token });
};
//funcion de obtener los restaurantes cerca
export const getNearbyRestaurants = async (req, res) => {
  const userId = req.user.userId;
  const token = req.token;

  const { city, coordinates, radius } = req.query;
  const defaultRadius = 5000; // Valor por defecto para el radio si no se proporciona uno

  const apiGoogle = "https://maps.googleapis.com/maps/api/place";
  // Verificar que solo una de las opciones esté presente
  if ((city && coordinates) || (!city && !coordinates)) {
    return res
      .status(400)
      .send("You must provide either city or coordinates, but not both");
  }

  const apiKey = process.env.API_KEY;

  let url;
  if (city) {
    // Construir URL para búsqueda por ciudad
    url = `${apiGoogle}/textsearch/json?query=restaurants+in+${encodeURIComponent(
      city
    )}&radius=${radius || defaultRadius}&key=${apiKey}`;
  } else {
    // Construir URL para búsqueda por coordenadas
    url = `${apiGoogle}/nearbysearch/json?location=${coordinates}&radius=${
      radius || defaultRadius
    }&type=restaurant&key=${apiKey}`;
  }

  try {
    const response = await axios.get(url);
    const data = response.data;

    if (data.status === "OK") {
      const restaurants = data.results.map((result) => ({
        name: result.name,
        address: result.vicinity,
        rating: result.rating || null,
      }));

      const idApiCon = await getActionIdByName("API Consumption");

      // Registro de la transacción de llamado servicio
      await registerLogoutTransaction(userId, idApiCon, restaurants);

      res.json({ restaurants });
    } else {
      res.status(500).send("Error fetching restaurants");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal server error");
  }
};

//funcion de obtener todas las transacciones
export const getTransactions = async (req, res) => {
  try {

    const userIdLog = req.user.userId
    // Extracción de parámetros de consulta opcionales
    const { userId, actionId, startDate, endDate } = req.query;

    // Construcción de la consulta SQL base
    let query = `
      SELECT t.id, t.user_id, a.name AS action, t.data, t.created_at
      FROM transactions t
      INNER JOIN actions a ON t.action_id = a.id
    `;

    const values = [];

    // Aplicar filtros según los parámetros proporcionados
    const conditions = [];

    // Filtro por userId
    if (userId) {
      conditions.push("t.user_id = $1");
      values.push(userId);
    }

    // Filtro por actionId
    if (actionId) {
      conditions.push("t.action_id = $" + (values.length + 1));
      values.push(actionId);
    }

    // Filtro por rango de fechas (startDate y endDate)
    if (startDate && endDate) {
      conditions.push("t.created_at >= $" + (values.length + 1));
      values.push(startDate);
      conditions.push("t.created_at <= $" + (values.length + 1));
      values.push(endDate);
    } else if (startDate) {
      conditions.push("t.created_at >= $" + (values.length + 1));
      values.push(startDate);
    } else if (endDate) {
      conditions.push("t.created_at <= $" + (values.length + 1));
      values.push(endDate);
    }

    // Agregar condiciones a la consulta SQL si existen filtros
    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    // Ordenar por fecha de creación descendente por defecto
    query += " ORDER BY t.created_at DESC";

    // Ejecutar la consulta con los valores filtrados
    const result = await pool.query(query, values);
    const transactions = result.rows;

    const idGetTrans = await getActionIdByName("GET Transaction");

    // Registro de la transacción
    await registerLogoutTransaction(userIdLog, idGetTrans,transactions);

    // Devolver las transacciones encontradas
    res.json({ transactions });
  } catch (error) {
    console.error("Error fetching transactions:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
// Función para cerrar la sesión del usuario
export const logout = async (req, res) => {
  try {
    const userId = req.user.userId;
    const token = req.token;

    // Verificación si el ID de usuario está presente
    if (!userId) {
      return res.status(401).json({ error: "Access denied. Invalid token." });
    }

    // Obtención de la sesión asociada al ID de usuario y el token hasheado
    const session = await pool.query(
      "SELECT * FROM sessions WHERE user_id = $1",
      [userId]
    );

    // Verificación si se encontró una sesión válida
    if (session.rows.length === 0) {
      return res.status(401).json({ error: "Invalid session. Logout failed." });
    }

    // Verificación si el token hasheado coincide con el token proporcionado
    const sessionData = session.rows[0];
    const isValidToken = await bcrypt.compare(token, sessionData.token_hash);

    if (!isValidToken) {
      return res
        .status(401)
        .json({ error: "Invalid token hash. Logout failed." });
    }

    // Eliminación de la sesión asociada al ID de usuario y el token hasheado
    await pool.query("DELETE FROM sessions WHERE user_id = $1", [userId]);

    const idLogOut = await getActionIdByName("User Logout");

    // Registro de la transacción de logout llamando a la función separada
    await registerLogoutTransaction(userId, idLogOut);

    // Devolución de un mensaje de éxito al cerrar la sesión
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    // Manejo de errores durante la interacción con la base de datos o problemas con el token
    res.status(500).json({ error: err.message });
  }
};
