import { pool } from "../db.js";
import {
  registerLogoutTransaction,
  isValidEmail,
  getActionIdByName,
} from "../controllers/helpers/fuctionsHelps.js";

// Mock de la conexión a la base de datos
jest.mock("../db.js", () => {
  const mPool = {
    query: jest.fn(),
  };
  return { pool: mPool };
});

describe("Auxiliary Functions", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("registerLogoutTransaction", () => {
    it("should insert a transaction with data", async () => {
      const userId = 1;
      const action = 1;
      const data = { some: "data" };

      await registerLogoutTransaction(userId, action, data);

      expect(pool.query).toHaveBeenCalledWith(
        "INSERT INTO transactions (user_id, action_id, data) VALUES ($1, $2, $3)",
        [userId, action, JSON.stringify(data)]
      );
    });

    it("should insert a transaction without data", async () => {
      const userId = 1;
      const action = 1;
      const data = null;

      await registerLogoutTransaction(userId, action, data);

      expect(pool.query).toHaveBeenCalledWith(
        "INSERT INTO transactions (user_id, action_id, data) VALUES ($1, $2, $3)",
        [userId, action, data]
      );
    });

    it("should throw an error if query fails", async () => {
      const userId = 1;
      const action = 1;
      const data = { some: "data" };
      pool.query.mockRejectedValueOnce(new Error("Query failed"));

      await expect(
        registerLogoutTransaction(userId, action, data)
      ).rejects.toThrow("Query failed");
    });
  });

  describe("isValidEmail", () => {
    it("should return true for valid email", () => {
      const email = "test@example.com";
      expect(isValidEmail(email)).toBe(true);
    });

    it("should return false for invalid email", () => {
      const email = "invalid-email";
      expect(isValidEmail(email)).toBe(false);
    });
  });

  describe("getActionIdByName", () => {
    it("should return action ID if action exists", async () => {
      const actionName = "login";
      const actionId = 1;
      pool.query.mockResolvedValueOnce({ rows: [{ id: actionId }] });

      const result = await getActionIdByName(actionName);
      expect(result).toBe(actionId);
    });

    it("should return null if action does not exist", async () => {
      const actionName = "nonexistent";
      pool.query.mockResolvedValueOnce({ rows: [] });

      const result = await getActionIdByName(actionName);
      expect(result).toBeNull();
    });

    it("should throw an error if query fails", async () => {
      const actionName = "login";
      pool.query.mockRejectedValueOnce(new Error("Query failed"));

      await expect(getActionIdByName(actionName)).rejects.toThrow(
        "Query failed"
      );
    });
  });
});

