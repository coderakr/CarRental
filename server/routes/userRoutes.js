import express from "express";
import {
  getCars,
  getUserData,
  LoginUser,
  registerUser,
} from "../controllers/userController.js";
import { protect } from "../middleware/auth.js";
const userRotuer = express.Router();

userRotuer.post("/register", registerUser);
userRotuer.post("/login", LoginUser);
userRotuer.get("/data", protect, getUserData);
userRotuer.get("/cars", getCars);

export default userRotuer;
