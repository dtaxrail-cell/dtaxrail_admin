import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

import upload from "../utils/multer.js";

import {

  getFilings,
  createFiling,
  getSingleFiling,

  requestAdditionalDocument,
  updateFilingStatus,
  uploadFilingResult,

} from "../controllers/filingController.js";

const router = express.Router();



// ADMIN GET ALL FILINGS
router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  getFilings
);



// GET SINGLE FILING
router.get(
  "/:filingId",

  authMiddleware,
  adminMiddleware,

  getSingleFiling
);



// CUSTOMER CREATE FILING
router.post(
  "/create",
  authMiddleware,
  createFiling
);



// REQUEST ADDITIONAL DOCS
router.post(
  "/request-documents/:filingId",

  authMiddleware,
  adminMiddleware,

  requestAdditionalDocument
);



// UPDATE FILING STATUS
router.put(
  "/status/:filingId",

  authMiddleware,
  adminMiddleware,

  updateFilingStatus
);



// UPLOAD FINAL RESULT
router.post(
  "/upload-result/:filingId",

  authMiddleware,
  adminMiddleware,

  upload.single("result"),

  uploadFilingResult
);

export default router;