import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

import {
  getFilings,
} from "../controllers/filingController.js";

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  getFilings
);

export default router;