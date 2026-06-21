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
  bulkUpdateFilings // <-- Added bulk update import
} from "../controllers/filingController.js";

import {
  getSheetLayout,
  saveSheetLayout,
} from "../controllers/filingLayoutController.js";

import { deleteDocument } from "../controllers/documentController.js";

const router = express.Router();

// ==========================================
// CUSTOMER — CREATE FILING
// ==========================================
router.post("/create", authMiddleware, createFiling);

// ==========================================
// CUSTOMER — GET ALL FILINGS
// ==========================================
router.get("/customer/all", authMiddleware, getCustomerFilingsForApp);

// ==========================================
// CUSTOMER — GET FILING RESULTS
// ==========================================
router.get("/customer/results", authMiddleware, getCustomerFilingResults);

// ==========================================
// ADMIN — GET ALL FILINGS (spreadsheet)
// ==========================================
router.get("/", authMiddleware, adminMiddleware, getFilings);

// ==========================================
// ADMIN — BULK UPDATE SPREADSHEET CHANGES
// ⚠️ Placed above /:filingId route parameters
// ==========================================
router.put("/bulk-update", authMiddleware, adminMiddleware, bulkUpdateFilings);

// ==========================================
// ADMIN — GET SHEET LAYOUT
// ==========================================
router.get("/sheet-layout", authMiddleware, adminMiddleware, getSheetLayout);

// ==========================================
// ADMIN — SAVE SHEET LAYOUT
// ==========================================
router.put("/sheet-layout", authMiddleware, adminMiddleware, saveSheetLayout);

// ==========================================
// ADMIN — ADD CUSTOM COLUMN DEFINITION
// ==========================================
router.post("/custom-columns", authMiddleware, adminMiddleware, addCustomColumn);

// ==========================================
// ADMIN — DELETE CUSTOM COLUMN
// ==========================================
router.delete("/custom-columns/:fieldKey", authMiddleware, adminMiddleware, deleteCustomColumn);

// ==========================================
// ADMIN — UPDATE STATUS (inline single cell edit fallback)
// ==========================================
router.put("/status/:filingId", authMiddleware, adminMiddleware, updateFilingStatus);

// ==========================================
// ADMIN — UPDATE PAYMENT STATUS (inline single cell edit fallback)
// ==========================================
router.put("/payment/:filingId", authMiddleware, adminMiddleware, updatePaymentStatusInline);

// ==========================================
// ADMIN — UPDATE A CUSTOM FIELD VALUE (single cell edit fallback)
// ==========================================
router.put("/custom-field/:filingId", authMiddleware, adminMiddleware, updateCustomField);

// ==========================================
// ADMIN — REQUEST ADDITIONAL DOCUMENTS
// ==========================================
router.post("/request-documents/:filingId", authMiddleware, adminMiddleware, requestAdditionalDocument);

// ==========================================
// ADMIN — UPLOAD FINAL RESULT
// ==========================================
router.post("/upload-result/:filingId", authMiddleware, adminMiddleware, upload.single("result"), uploadFilingResult);

// ==========================================
// ADMIN — DELETE A DOCUMENT
// ==========================================
router.delete("/delete-document/:documentId", authMiddleware, adminMiddleware, deleteDocument);

// ==========================================
// ADMIN — GET SINGLE FILING WORKSPACE
// ⚠️ Places last to catch parameter fallback patterns
// ==========================================
router.get("/:filingId", authMiddleware, adminMiddleware, getSingleFiling);

export default router;