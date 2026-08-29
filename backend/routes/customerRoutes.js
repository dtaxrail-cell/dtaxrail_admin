import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import { getPool } from "../config/db.js";
import { getCustomers } from "../controllers/customerController.js";

const router = express.Router();

// Clean empty strings or whitespace into explicit null values
const formatPhone = (phone) => {
  if (!phone || typeof phone !== "string") return null;
  const trimmed = phone.trim();
  return trimmed.length > 0 ? trimmed : null;
};

// ==========================================
// ADMIN - GET ALL CUSTOMERS
// ==========================================
router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  getCustomers
);

// ==========================================
// GET CURRENT CUSTOMER
// ==========================================
router.get(
  "/me",
  authMiddleware,
  async (req, res) => {
    try {
      const uid = req.user?.uid;

      if (!uid) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: Missing user authentication token",
        });
      }

      const pool = getPool();
      const result = await pool.query(
        `SELECT * FROM customers WHERE firebase_uid = $1 LIMIT 1`,
        [uid]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }

      return res.json({
        success: true,
        customer: result.rows[0],
      });

    } catch (error) {
      console.error("GET /me ERROR:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to retrieve profile",
      });
    }
  }
);

// ==========================================
// CUSTOMER - UPDATE PHONE / AUTO-REGISTER
// Safe UPSERT for Serverless Environments
// ==========================================
router.post(
  "/update-phone",
  authMiddleware,
  async (req, res) => {
    try {
      const uid = req.user?.uid;

      if (!uid) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: Missing Firebase UID",
        });
      }

      // 1. Sanitize incoming payload
      const inputName = req.body?.name || req.user?.name || "Apple User";
      const inputEmail = req.body?.email || req.user?.email || `${uid}@privaterelay.appleid.com`;
      const inputPhone = formatPhone(req.body?.phone);

      const pool = getPool();

      // 2. Perform safe UPSERT with explicit parameter casting
      const upsertQuery = `
        INSERT INTO customers (firebase_uid, name, email, phone, biometric_enabled)
        VALUES ($1, $2, $3, $4::text, false)
        ON CONFLICT (firebase_uid)
        DO UPDATE SET
          name = CASE WHEN EXCLUDED.name IS NOT NULL AND EXCLUDED.name != '' THEN EXCLUDED.name ELSE customers.name END,
          email = CASE WHEN EXCLUDED.email IS NOT NULL AND EXCLUDED.email != '' THEN EXCLUDED.email ELSE customers.email END,
          phone = COALESCE(EXCLUDED.phone, customers.phone),
          updated_at = CURRENT_TIMESTAMP
        RETURNING *;
      `;

      const result = await pool.query(upsertQuery, [
        uid,
        inputName,
        inputEmail,
        inputPhone,
      ]);

      return res.status(200).json({
        success: true,
        message: "Customer profile synchronized successfully",
        customer: result.rows[0],
      });

    } catch (error) {
      console.error("CRITICAL /update-phone SERVERLESS ERROR:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Internal server error updating customer profile",
      });
    }
  }
);

export default router;