import express from "express";

import authMiddleware
from "../middleware/authMiddleware.js";

import adminMiddleware
from "../middleware/adminMiddleware.js";

import {
  getTaxTools,
  updateTaxTools,
}
from "../controllers/taxToolsController.js";

const router = express.Router();

router.get(
  "/",
  getTaxTools
);

router.put(
  "/",
  authMiddleware,
  adminMiddleware,
  updateTaxTools
);

export default router;