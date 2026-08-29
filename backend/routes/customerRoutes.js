import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import { getPool } from "../config/db.js";
import { getCustomers } from "../controllers/customerController.js";

const router = express.Router();

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
// Handles missing UNIQUE constraint safely via manual check
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

      const inputName = req.body?.name || req.user?.name || "Apple User";
      const inputEmail = req.body?.email || req.user?.email || `${uid}@privaterelay.appleid.com`;
      const inputPhone = formatPhone(req.body?.phone);

      const pool = getPool();

      // 1. Check if user exists by firebase_uid OR email
      const existing = await pool.query(
        `SELECT * FROM customers WHERE firebase_uid = $1 OR email = $2 LIMIT 1`,
        [uid, inputEmail]
      );

      let customerRow;

      if (existing.rows.length > 0) {
        // 2. Update existing customer
        const updateResult = await pool.query(
          `
          UPDATE customers
          SET firebase_uid = $1,
              name = COALESCE(NULLIF($2, ''), name),
              email = COALESCE(NULLIF($3, ''), email),
              phone = COALESCE($4, phone),
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $5
          RETURNING *;
          `,
          [uid, inputName, inputEmail, inputPhone, existing.rows[0].id]
        );
        customerRow = updateResult.rows[0];
      } else {
        // 3. Insert new customer
        const insertResult = await pool.query(
          `
          INSERT INTO customers (firebase_uid, name, email, phone, biometric_enabled)
          VALUES ($1, $2, $3, $4, false)
          RETURNING *;
          `,
          [uid, inputName, inputEmail, inputPhone]
        );
        customerRow = insertResult.rows[0];
      }

      return res.status(200).json({
        success: true,
        message: "Customer profile synchronized successfully",
        customer: customerRow,
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