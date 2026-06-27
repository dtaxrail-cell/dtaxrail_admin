import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

import upload from "../utils/multer.js";

import { getPool } from "../config/db.js";

import {

  getDocumentFolders,
  getCustomerFilings,
  getDocumentsByFiling,

} from "../controllers/documentController.js";

const router = express.Router();





// ==========================================
// GET CUSTOMER FOLDERS
// ==========================================
router.get(

  "/folders",

  authMiddleware,
  adminMiddleware,

  getDocumentFolders
);





// ==========================================
// GET ALL MEMBER FILINGS
// ==========================================
router.get(

  "/customer/:customerId",

  authMiddleware,
  adminMiddleware,

  getCustomerFilings
);





// ==========================================
// GET SINGLE FILING DOCUMENTS
// ==========================================
router.get(

  "/filing/:filingId",

  authMiddleware,
  adminMiddleware,

  getDocumentsByFiling
);





// ==========================================
// UPLOAD DOCUMENT
// ==========================================
router.post(

  "/upload",

  authMiddleware,

  upload.single("document"),

  async (req, res) => {

    try {

      const {

        filing_id,
        document_type,

      } = req.body;

      const { email } = req.user;





      // FIND CUSTOMER
      const customerResult =
      await getPool().query(

        `
        SELECT *

        FROM customers

        WHERE email = $1
        `,

        [email]
      );





      if (
        customerResult.rows.length === 0
      ) {

        return res.status(404).json({

          success: false,
          message: "Customer not found",

        });
      }

      const customer =
      customerResult.rows[0];






      // FILE DATA
      // ✅ After
const fileUrl = req.file.location;

      const fileName =
      req.file.originalname;

      const mimeType =
      req.file.mimetype;

      const fileSize =
      req.file.size?.toString();






      // INSERT DOCUMENT
      const result =
      await getPool().query(

        `
        INSERT INTO documents (

          filing_id,
          customer_id,

          document_name,

          file_url,
          file_size,
          mime_type

        )

        VALUES ($1, $2, $3, $4, $5, $6)

        RETURNING *
        `,

        [

          filing_id,

          customer.id,

          document_type || fileName,

          fileUrl,
          fileSize,
          mimeType,

        ]
      );






      return res.status(200).json({

        success: true,

        document:
        result.rows[0],

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