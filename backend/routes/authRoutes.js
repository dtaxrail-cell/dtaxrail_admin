import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getPool } from "../config/db.js";

const router = express.Router();

// Helper function to turn empty strings or invalid inputs into SQL NULL
const formatPhone = (phone) => {
  if (!phone || typeof phone !== "string") return null;
  const trimmed = phone.trim();
  return trimmed.length > 0 ? trimmed : null;
};

// ==========================================
// SYNC CUSTOMER (Google / Apple / Phone)
// ==========================================
router.post(
  "/sync-customer",
  authMiddleware,
  async (req, res) => {
    try {
      const uid = req.user?.uid;
      if (!uid) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      // Prioritize req.body (sent by Flutter) over req.user
      const inputName = req.body?.name || req.user?.name || "Apple User";
      const inputEmail = req.body?.email || req.user?.email || `${uid}@privaterelay.appleid.com`;
      const inputPhone = formatPhone(req.body?.phone || req.user?.phone_number);

      // Check if customer already exists by firebase_uid OR email
      const existingCustomer = await getPool().query(
        `SELECT * FROM customers WHERE firebase_uid = $1 OR email = $2`,
        [uid, inputEmail]
      );

      let customer;

      if (existingCustomer.rows.length === 0) {
        // Insert new customer safely
        const insertResult = await getPool().query(
          `INSERT INTO customers (firebase_uid, name, email, phone, biometric_enabled)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [uid, inputName, inputEmail, inputPhone, false]
        );
        customer = insertResult.rows[0];
        console.log("Customer created:", customer.id);
      } else {
        // Update existing customer safely
        const updateResult = await getPool().query(
          `UPDATE customers 
           SET firebase_uid = $1,
               name = COALESCE(NULLIF($2, ''), name),
               email = COALESCE(NULLIF($3, ''), email),
               phone = COALESCE($4, phone),
               updated_at = CURRENT_TIMESTAMP
           WHERE firebase_uid = $1 OR email = $3
           RETURNING *`,
          [uid, inputName, inputEmail, inputPhone]
        );
        customer = updateResult.rows[0];
        console.log("Customer updated/synced:", customer?.id);
      }

      return res.json({
        success: true,
        message: "Customer synced successfully",
        customer: customer,
      });

    } catch (error) {
      console.error("SYNC CUSTOMER ERROR:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
);

// ==========================================
// UPDATE PHONE / AUTO-REGISTRATION FALLBACK
// Fixes CustomerService.getProfile() 404 auto-creation
// ==========================================
router.post(
  "/update-phone",
  authMiddleware,
  async (req, res) => {
    try {
      const uid = req.user?.uid;
      if (!uid) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const inputName = req.body?.name || req.user?.name || "Apple User";
      const inputEmail = req.body?.email || req.user?.email || `${uid}@privaterelay.appleid.com`;
      const inputPhone = formatPhone(req.body?.phone);

      const result = await getPool().query(
        `INSERT INTO customers (firebase_uid, name, email, phone, biometric_enabled)
         VALUES ($1, $2, $3, $4, false)
         ON CONFLICT (firebase_uid) 
         DO UPDATE SET 
           name = COALESCE(NULLIF(EXCLUDED.name, ''), customers.name),
           email = COALESCE(NULLIF(EXCLUDED.email, ''), customers.email),
           phone = COALESCE(EXCLUDED.phone, customers.phone),
           updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [uid, inputName, inputEmail, inputPhone]
      );

      return res.json({
        success: true,
        message: "Customer profile created/updated",
        customer: result.rows[0],
      });

    } catch (error) {
      console.error("UPDATE PHONE ERROR:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
);

// ==========================================
// ENABLE BIOMETRIC
// ==========================================
router.post(
  "/enable-biometric",
  authMiddleware,
  async (req, res) => {
    try {
      const { uid } = req.user;

      await getPool().query(
        `UPDATE customers SET biometric_enabled = true WHERE firebase_uid = $1`,
        [uid]
      );

      res.json({ success: true, message: "Biometric enabled" });

    } catch (error) {
      console.log(error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// ==========================================
// DISABLE BIOMETRIC
// ==========================================
router.post(
  "/disable-biometric",
  authMiddleware,
  async (req, res) => {
    try {
      const { uid } = req.user;

      await getPool().query(
        `UPDATE customers SET biometric_enabled = false WHERE firebase_uid = $1`,
        [uid]
      );

      res.json({ success: true, message: "Biometric disabled" });

    } catch (error) {
      console.log(error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// ==========================================
// DELETE ACCOUNT
// ==========================================
router.delete(
  "/delete-account",
  authMiddleware,
  async (req, res) => {
    const client = await getPool().connect();

    try {
      const { uid, email } = req.user;
      const targetEmail = email || `${uid}@privaterelay.appleid.com`;

      await client.query("BEGIN");

      // 1. Find the customer
      const customerResult = await client.query(
        `SELECT id FROM customers WHERE firebase_uid = $1 OR email = $2`,
        [uid, targetEmail]
      );

      if (customerResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ success: false, message: "Customer not found" });
      }

      const customerId = customerResult.rows[0].id;

      // 2. Get all filings for this customer
      const filingsResult = await client.query(
        `SELECT id FROM filings WHERE customer_id = $1`,
        [customerId]
      );

      const filingIds = filingsResult.rows.map((r) => r.id);

      // 3. Delete all filing-related data
      for (const filingId of filingIds) {
        await client.query(`DELETE FROM documents WHERE filing_id = $1`, [filingId]);
        await client.query(`DELETE FROM filing_results WHERE filing_id = $1`, [filingId]);
        await client.query(`DELETE FROM filing_messages WHERE filing_id = $1`, [filingId]);
        await client.query(`DELETE FROM filing_status_history WHERE filing_id = $1`, [filingId]);
      }

      // 4. Delete payments
      await client.query(`DELETE FROM payments WHERE customer_id = $1`, [customerId]);

      // 5. Delete filings
      await client.query(`DELETE FROM filings WHERE customer_id = $1`, [customerId]);

      // 6. Delete members
      await client.query(`DELETE FROM members WHERE customer_id = $1`, [customerId]);

      // 7. Delete customer row
      await client.query(`DELETE FROM customers WHERE id = $1`, [customerId]);

      await client.query("COMMIT");

      console.log(`Account deleted for customer: ${customerId} (uid: ${uid})`);

      return res.json({ success: true, message: "Account deleted successfully" });

    } catch (error) {
      await client.query("ROLLBACK");
      console.log("DELETE ACCOUNT ERROR:", error);
      return res.status(500).json({ success: false, error: error.message });
    } finally {
      client.release();
    }
  }
);

export default router;