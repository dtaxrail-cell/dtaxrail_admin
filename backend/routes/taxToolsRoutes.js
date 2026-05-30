import express from "express";

import authMiddleware
from "../middleware/authMiddleware.js";

import adminMiddleware
from "../middleware/adminMiddleware.js";

import {
  getCalculatorConfig,
  updateCalculatorConfig,
  getRegimeConfig,
  updateRegimeConfig,
}
from "../controllers/taxToolsController.js";

const router = express.Router();

router.get(
  "/calculator",
  getCalculatorConfig
);

router.put(
  "/calculator",
  authMiddleware,
  adminMiddleware,
  updateCalculatorConfig
);

router.get(
  "/regime",
  getRegimeConfig
);

router.put(
  "/regime",
  authMiddleware,
  adminMiddleware,
  updateRegimeConfig
);

export default router;