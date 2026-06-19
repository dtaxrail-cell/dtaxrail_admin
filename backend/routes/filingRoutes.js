import express from "express";

import authMiddleware  from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

import upload from "../utils/multer.js";

import {

  getFilings,
  createFiling,
  getSingleFiling,

  requestAdditionalDocument,
  updateFilingStatus,
  updatePaymentStatusInline,
  uploadFilingResult,

  updateCustomField,
  addCustomColumn,
  deleteCustomColumn,

  getCustomerFilingsForApp,
  getCustomerFilingResults,

} from "../controllers/filingController.js";

const router = express.Router();



// ==========================================
// CUSTOMER — CREATE FILING
// ⚠️ Must be before /:filingId
// ==========================================
router.post(
  "/create",
  authMiddleware,
  createFiling
);



// ==========================================
// CUSTOMER — GET ALL FILINGS
// ⚠️ Must be before /:filingId
// ==========================================
router.get(
  "/customer/all",
  authMiddleware,
  getCustomerFilingsForApp
);



// ==========================================
// CUSTOMER — GET FILING RESULTS
// ⚠️ Must be before /:filingId
// ==========================================
router.get(
  "/customer/results",
  authMiddleware,
  getCustomerFilingResults
);



// ==========================================
// ADMIN — GET ALL FILINGS (spreadsheet)
// ==========================================
router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  getFilings
);



// ==========================================
// ADMIN — ADD CUSTOM COLUMN DEFINITION
// ⚠️ Must be before /:filingId
// ==========================================
router.post(
  "/custom-columns",
  authMiddleware,
  adminMiddleware,
  addCustomColumn
);



// ==========================================
// ADMIN — DELETE CUSTOM COLUMN
// ⚠️ Must be before /:filingId
// ==========================================
router.delete(
  "/custom-columns/:fieldKey",
  authMiddleware,
  adminMiddleware,
  deleteCustomColumn
);



// ==========================================
// ADMIN — UPDATE STATUS (inline cell edit)
// ==========================================
router.put(
  "/status/:filingId",
  authMiddleware,
  adminMiddleware,
  updateFilingStatus
);



// ==========================================
// ADMIN — UPDATE PAYMENT STATUS (inline cell edit)
// ==========================================
router.put(
  "/payment/:filingId",
  authMiddleware,
  adminMiddleware,
  updatePaymentStatusInline
);



// ==========================================
// ADMIN — UPDATE A CUSTOM FIELD VALUE (cell edit)
// ==========================================
router.put(
  "/custom-field/:filingId",
  authMiddleware,
  adminMiddleware,
  updateCustomField
);



// ==========================================
// ADMIN — REQUEST ADDITIONAL DOCUMENTS
// ==========================================
router.post(
  "/request-documents/:filingId",
  authMiddleware,
  adminMiddleware,
  requestAdditionalDocument
);



// ==========================================
// ADMIN — DELETE INDIVIDUAL DOCUMENT
// ==========================================
router.delete(
  "/documents/:documentId",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { documentId } = req.params;

      // 1. Verify document presence before running structural dropping routine
      const checkDoc = await getPool().query(
        "SELECT * FROM documents WHERE id = $1",
        [documentId]
      );

      if (checkDoc.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Document not found." });
      }

      // 2. Perform table ledger row removal
      await getPool().query(
        "DELETE FROM documents WHERE id = $1",
        [documentId]
      );

      return res.json({ success: true, message: "Document removed successfully." });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
);



// ==========================================
// ADMIN — UPLOAD FINAL RESULT
// ==========================================
router.post(
  "/upload-result/:filingId",
  authMiddleware,
  adminMiddleware,
  upload.single("result"),
  uploadFilingResult
);



// ==========================================
// ADMIN — GET SINGLE FILING WORKSPACE
// ⚠️ Must be last — catches all /:filingId
// ==========================================
router.get(
  "/:filingId",
  authMiddleware,
  adminMiddleware,
  getSingleFiling
);



export default router;