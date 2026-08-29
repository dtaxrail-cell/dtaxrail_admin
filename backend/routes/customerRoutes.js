import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import { getPool } from "../config/db.js";
import { getCustomers } from "../controllers/customerController.js";

const router = express.Router();

// Helper function to turn empty or space-only phone strings into SQL NULL
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
      const { uid } = req.user;

      const result = await getPool().query(
        `
        SELECT *
        FROM customers
        WHERE firebase_uid = $1
        `,
        [uid]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }

      res.json({
        success: true,
        customer: result.rows[0],
      });

    } catch (error) {
      console.log("GET /me ERROR:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// ==========================================
// CUSTOMER - UPDATE PHONE / AUTO-REGISTER
// Handles both phone updates AND auto-creating missing Apple/Google profiles
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
          message: "Unauthorized",
        });
      }

      // Read details from request body (sent by Flutter) or fallback to Firebase token
      const inputName = req.body?.name || req.user?.name || "Apple User";
      const inputEmail = req.body?.email || req.user?.email || `${uid}@privaterelay.appleid.com`;
      const inputPhone = formatPhone(req.body?.phone);

      // Perform an UPSERT (INSERT or UPDATE on conflict)
      const result = await getPool().query(
        `
        INSERT INTO customers (firebase_uid, name, email, phone, biometric_enabled)
        VALUES ($1, $2, $3, $4, false)
        ON CONFLICT (firebase_uid)
        DO UPDATE SET
          name = COALESCE(NULLIF(EXCLUDED.name, ''), customers.name),
          email = COALESCE(NULLIF(EXCLUDED.email, ''), customers.email),
          phone = COALESCE(EXCLUDED.phone, customers.phone),
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
        `,
        [uid, inputName, inputEmail, inputPhone]
      );

      return res.json({
        success: true,
        message: "Customer updated successfully",
        customer: result.rows[0],
      });

    } catch (error) {
      console.log("UPDATE PHONE ERROR:", error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

export default router;