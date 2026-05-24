import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

import upload from "../utils/multer.js";
import { getPool } from "../config/db.js";

import {
  getDocumentFolders,
} from "../controllers/documentController.js";

const router = express.Router();



// GET DOCUMENT FOLDERS
router.get(
  "/folders",
  authMiddleware,
  adminMiddleware,
  getDocumentFolders
);



// UPLOAD DOCUMENT
router.post(
  "/upload",
  upload.single("document"),
  async (req, res) => {
    console.log("UPLOAD ROUTE HIT");
    try {

      const fileUrl = req.file.path;
      const fileName = req.file.originalname;

      const result = await getPool().query(
        `
        INSERT INTO documents (
          document_name,
          file_url,
          mime_type
        )
        VALUES ($1, $2, $3)
        RETURNING *
        `,
        [
          fileName,
          fileUrl,
          req.file.mimetype,
        ]
      );

      return res.status(200).json({
        success: true,
        document: result.rows[0],
      });

    } catch (error) {
      console.error(error);

      return res.status(500).json({
        success: false,
        message: "Upload failed",
        error: error.message,
      });
    }
  }
);

export default router;