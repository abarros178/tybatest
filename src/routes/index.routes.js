import { Router } from "express";
import {
  register,
  login,
  getNearbyRestaurants,
  getTransactions,
  logout,
} from "../controllers/users.controller.js";
import { authenticateToken } from '../middleware/auth/authenticateToken.js';

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get('/restaurants-nearby', authenticateToken, getNearbyRestaurants);
router.get("/transactions", authenticateToken, getTransactions);
router.post("/logout", authenticateToken, logout);


export default router;
