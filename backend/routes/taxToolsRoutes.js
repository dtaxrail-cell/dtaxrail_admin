import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

import {
  // ── New routes ──────────────────────────────────────────────────────────
  getAllYears,
  getYearConfig,
  calculateTax,
  adminGetYearConfig,
  adminCreateYear,
  adminSaveYearConfig,
  adminDeleteYear,                          // ← NEW

  // ── Legacy routes (keep until Flutter + admin panel fully migrated) ─────
  getCalculatorConfig,
  updateCalculatorConfig,
  getRegimeConfig,
  updateRegimeConfig,
} from "../controllers/taxToolsController.js";

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC — customer app
// ─────────────────────────────────────────────────────────────────────────────

// List all available financial years
router.get("/years", getAllYears);

// Full config for a year (slabs, limits, messages)
router.get("/config/:year", getYearConfig);

// Server-side tax calculation
router.post("/calculate", calculateTax);

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — protected
// ─────────────────────────────────────────────────────────────────────────────

// IMPORTANT: /admin/years must be registered BEFORE /admin/:year
// otherwise Express will match "years" as the :year param.

router.post(
  "/admin/years",
  authMiddleware,
  adminMiddleware,
  adminCreateYear
);

router.get(
  "/admin/:year",
  authMiddleware,
  adminMiddleware,
  adminGetYearConfig
);

router.put(
  "/admin/:year",
  authMiddleware,
  adminMiddleware,
  adminSaveYearConfig
);

router.delete(                              // ← NEW
  "/admin/:year",
  authMiddleware,
  adminMiddleware,
  adminDeleteYear
);

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY — do NOT remove until both Flutter & admin are fully migrated
// ─────────────────────────────────────────────────────────────────────────────

router.get("/calculator", getCalculatorConfig);
router.put("/calculator", authMiddleware, adminMiddleware, updateCalculatorConfig);

router.get("/regime", getRegimeConfig);
router.put("/regime", authMiddleware, adminMiddleware, updateRegimeConfig);

export default router;