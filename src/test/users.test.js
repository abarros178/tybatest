import request from "supertest";
import app from "../index.js";
import { pool } from "../db.js";

describe("POST /api/register", () => {
  // Prueba para verificar el registro exitoso de un nuevo usuario
  test("should respond with a 201 status code and user data", async () => {
    const newUser = {
      username: "testuser2",
      email: "testuser2@example.com",
      password: "password123",
    };

    // Realiza una solicitud POST a la ruta /api/register con los datos del nuevo usuario
    const response = await request(app).post("/api/register").send(newUser);

    // Verifica que la respuesta sea exitosa (status 201)
    expect(response.statusCode).toBe(201);

    // Verifica que el cuerpo de la respuesta contenga la información del usuario creado
    expect(response.body).toEqual({
      error: 0,
      message: "User created successfully",
      data: expect.objectContaining({
        username: newUser.username,
        email: newUser.email,
        // Añade más campos según sea necesario para verificar la respuesta
      }),
    });
  });

  // Prueba para verificar la validación de datos de entrada (contraseña corta)
  test("should respond with a 400 status code for short password", async () => {
    const newUser = {
      username: "testuser2",
      email: "testuser2@example.com",
      password: "pass", // Contraseña corta intencionalmente para fallar la validación
    };

    const response = await request(app).post("/api/register").send(newUser);

    // Verifica que la respuesta sea un error de validación (status 400)
    expect(response.statusCode).toBe(400);

    // Verifica el mensaje de error devuelto en la respuesta
    expect(response.body).toEqual({
      error: 1,
      message: "Password must be at least 6 characters long",
    });
  });

  // Prueba para verificar la validación de datos de entrada (nombre de usuario demasiado corto)
  test("should respond with a 400 status code for short username", async () => {
    const newUser = {
      username: "us",
      email: "testuser3@example.com",
      password: "password123",
    };

    const response = await request(app).post("/api/register").send(newUser);

    // Verifica que la respuesta sea un error de validación (status 400)
    expect(response.statusCode).toBe(400);

    // Verifica el mensaje de error devuelto en la respuesta
    expect(response.body).toEqual({
      error: 1,
      message: "Username must be between 3 and 50 characters long",
    });
  });

  // Prueba para verificar la validación de datos de entrada (correo electrónico inválido)
  test("should respond with a 400 status code for invalid email", async () => {
    const newUser = {
      username: "testuser4",
      email: "invalidemail", // Correo electrónico inválido
      password: "password123",
    };

    const response = await request(app).post("/api/register").send(newUser);

    // Verifica que la respuesta sea un error de validación (status 400)
    expect(response.statusCode).toBe(400);

    // Verifica el mensaje de error devuelto en la respuesta
    expect(response.body).toEqual({
      error: 1,
      message: "Invalid email address",
    });
  });

  // Prueba para verificar la validación de datos de entrada (nombre de usuario duplicado)
  test("should respond with a 400 status code for duplicate username", async () => {
    // Simular la existencia de un usuario con el mismo nombre de usuario en la base de datos
    // Puedes utilizar mocks o stubs para simular esta respuesta de la base de datos
    jest
      .spyOn(pool, "query")
      .mockResolvedValueOnce({ rows: [{ username: "testuser2" }] });

    const newUser = {
      username: "testuser2", // Nombre de usuario duplicado
      email: "testuser5@example.com",
      password: "password123",
    };

    const response = await request(app).post("/api/register").send(newUser);

    // Verifica que la respuesta sea un error de validación (status 400)
    expect(response.statusCode).toBe(400);

    // Verifica el mensaje de error devuelto en la respuesta
    expect(response.body).toEqual({
      error: 1,
      message: "Username already exists",
    });
  });

  // Prueba para verificar la respuesta de error interno del servidor (fallo en la base de datos)
  test("should respond with a 500 status code for database failure", async () => {
    // Simular un fallo en la conexión a la base de datos
    jest
      .spyOn(pool, "query")
      .mockRejectedValueOnce(new Error("Database connection error"));

    const newUser = {
      username: "testuser8",
      email: "testuser8@example.com",
      password: "password123",
    };

    const response = await request(app).post("/api/register").send(newUser);

    // Verifica que la respuesta sea un error interno del servidor (status 500)
    expect(response.statusCode).toBe(500);

    // Verifica el mensaje de error devuelto en la respuesta
    expect(response.body).toEqual({
      error: 1,
      message: "Internal server error",
    });
  });
});

describe("POST /login", () => {
  test("should respond with a 201 status code and return a JWT token", async () => {
    const response = await request(app).post("/api/login").send({
      username: "username", // Ajusta según los datos de prueba
      password: "password", // Ajusta según los datos de prueba
    });

    // Verificar el estado de la respuesta
    expect(response.statusCode).toBe(201);

    // Verificar que se haya devuelto un token en la respuesta
    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toHaveProperty("token");
  });

  test("should respond with a 400 status code for invalid credentials", async () => {
    const response = await request(app).post("/api/login").send({
      username: "invalid_username", // Usuario inválido
      password: "invalid_password", // Contraseña inválida
    });

    // Verificar el estado de la respuesta
    expect(response.statusCode).toBe(400);
  });
});

describe("GET /restaurants-nearby", () => {
  test("should respond with a 200 status code and return nearby restaurants", async () => {
    const token = process.env.TOKEN_TEMP;
    const mockReq = {
      user: {
        userId: 1, // Usuario ficticio para la prueba
      },
      query: {
        city: "New York", // Ciudad ficticia para la prueba
        radius: 5000, // Radio ficticio para la prueba
      },
    };

    const response = await request(app)
      .get("/api/restaurants-nearby")
      .query(mockReq.query)
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${token}`); // Envía el token en el encabezado Authorization

    // Verificar el estado de la respuesta
    expect(response.statusCode).toBe(200);

    // Verificar que se haya devuelto la información de los restaurantes
    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toHaveProperty("restaurants");
    expect(response.body.error).toBe(0);
  });

  test("should respond with a 400 status code for invalid parameters", async () => {
    const token = process.env.TOKEN_TEMP;
    const mockReq = {
      user: {
        userId: 1, // Usuario ficticio para la prueba
      },
      query: {
        coordinates: "40.7128,-74.0060", // Coordenadas ficticias para la prueba
        city: "New York", // Ciudad ficticia para la prueba (no debe estar presente junto con coordinates)
        radius: 5000, // Radio ficticio para la prueba
      },
    };

    const response = await request(app)
      .get("/api/restaurants-nearby")
      .query(mockReq.query)
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${token}`); // Envía el token en el encabezado Authorization

    // Verificar el estado de la respuesta
    expect(response.statusCode).toBe(400);

    // Verificar el mensaje de error devuelto
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe(1);
  });
});

describe("GET /transactions", () => {
  let token; // Variable para almacenar el token JWT generado

  // Antes de todas las pruebas, genera un token JWT válido
  beforeAll(() => {
    token = process.env.TOKEN_TEMP; // Genera un token para el usuario ficticio con ID 1
  });

  // Después de todas las pruebas, cierra la conexión a la base de datos
  afterAll(async () => {
    await pool.end(); // Asegúrate de cerrar la conexión a la base de datos al final de las pruebas
  });

  test("should respond with a 200 status code and return all transactions", async () => {
    const response = await request(app)
      .get("/api/transactions")
      .set("Authorization", `Bearer ${token}`)
      .expect("Content-Type", /json/)
      .expect(200);

    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toHaveProperty("transactions");
    expect(response.body.error).toBe(0);
  });

  test("should respond with a 200 status code and return filtered transactions by userId", async () => {
    const userId = 1; // Usuario ficticio para la prueba
    const response = await request(app)
      .get("/api/transactions")
      .query({ userId })
      .set("Authorization", `Bearer ${token}`)
      .expect("Content-Type", /json/)
      .expect(200);

    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toHaveProperty("transactions");
    expect(response.body.error).toBe(0);

    const transactions = response.body.data.transactions;
    transactions.forEach((transaction) => {
      expect(transaction.user_id).toBe(userId); // Verifica que todas las transacciones sean del usuario especificado
    });
  });

  test("should respond with a 200 status code and empty transactions array for invalid filters", async () => {
    // Realiza una solicitud con filtros que no devuelvan ninguna transacción válida
    const response = await request(app)
      .get("/api/transactions")
      .query({
        // Puedes usar parámetros que sabes que no devolverán transacciones válidas
        userId: "999999", // Un ID que no existe en la base de datos
        actionId: "999999", // Un ID de acción que no existe en la base de datos
        startDate: "2024-01-01",
        endDate: "2023-01-01",
      })
      .set("Authorization", `Bearer ${token}`)
      .expect("Content-Type", /json/)
      .expect(200);

    // Verificar que el cuerpo de la respuesta contenga las propiedades esperadas
    expect(response.body).toHaveProperty("error", 0);
    expect(response.body).toHaveProperty("message", "Successful");
    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toHaveProperty("transactions");
    expect(Array.isArray(response.body.data.transactions)).toBe(true);
    expect(response.body.data.transactions.length).toBe(0); // Verificar que el array de transacciones esté vacío
  });
});


