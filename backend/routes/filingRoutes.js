import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

import {
  getFilings,
  createFiling,
} from "../controllers/filingController.js";

const router = express.Router();



// ADMIN GET ALL FILINGS
router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  getFilings
);



// CUSTOMER CREATE FILING
router.post(
  "/create",
  authMiddleware,
  createFiling
);

export default router;