import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getPool } from "../config/db.js";

const router = express.Router();


// ==========================================
// SYNC CUSTOMER
// ==========================================
router.post(
  "/sync-customer",
  authMiddleware,
  async (req, res) => {

    try {

      const { uid, email, name } = req.user;

      const existingCustomer = await getPool().query(
        `SELECT * FROM customers WHERE firebase_uid = $1 OR email = $2`,
        [uid, email]
      );

      if (existingCustomer.rows.length === 0) {

        await getPool().query(
          `INSERT INTO customers (firebase_uid, name, email, biometric_enabled)
           VALUES ($1, $2, $3, $4)`,
          [uid, name || "Customer", email, false]
        );

        console.log("Customer created");

      } else {

        await getPool().query(
          `UPDATE customers SET firebase_uid = $1 WHERE email = $2`,
          [uid, email]
        );

        console.log("Customer already exists");
      }

      res.json({ success: true, message: "Customer synced" });

    } catch (error) {

      console.log(error);
      res.status(500).json({ success: false, error: error.message });
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
// Deletes: documents → filing_results → filing_messages →
//          filing_status_history → filings → members → customer
// Firebase user deletion is handled on the Flutter side
// ==========================================
router.delete(
  "/delete-account",
  authMiddleware,
  async (req, res) => {

    const client = await getPool().connect();

    try {

      const { uid, email } = req.user;

      await client.query("BEGIN");

      // 1. Find the customer
      const customerResult = await client.query(
        `SELECT id FROM customers WHERE firebase_uid = $1 OR email = $2`,
        [uid, email]
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
        await client.query(`DELETE FROM documents                WHERE filing_id = $1`, [filingId]);
        await client.query(`DELETE FROM filing_results           WHERE filing_id = $1`, [filingId]);
        await client.query(`DELETE FROM filing_messages          WHERE filing_id = $1`, [filingId]);
        await client.query(`DELETE FROM filing_status_history    WHERE filing_id = $1`, [filingId]);
      }

      // 4. Delete payments (linked to customer directly)
      await client.query(`DELETE FROM payments WHERE customer_id = $1`, [customerId]);

      // 5. Delete filings
      await client.query(`DELETE FROM filings WHERE customer_id = $1`, [customerId]);

      // 6. Delete members (CASCADE handles their filings already but belt-and-braces)
      await client.query(`DELETE FROM members WHERE customer_id = $1`, [customerId]);

      // 7. Delete notifications
      //await client.query(`DELETE FROM notifications WHERE customer_id = $1`, [customerId]);

      // 8. Delete the customer row itself
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