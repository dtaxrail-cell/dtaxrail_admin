import { getPool } from "../config/db.js";
import { v2 as cloudinary } from "cloudinary";



// ==========================================
// GET CUSTOMER FOLDERS
// ==========================================
export const getDocumentFolders =
async (req, res) => {

  try {

    const result =
    await getPool().query(

      `
      SELECT

        customers.id,
        customers.name,
        customers.email,
        customers.phone,
        customers.pan_number,

        COUNT(DISTINCT filings.id)
        AS filing_count,

        COUNT(documents.id)
        AS document_count

      FROM customers

      LEFT JOIN filings
      ON customers.id = filings.customer_id

      LEFT JOIN documents
      ON filings.id = documents.filing_id

      GROUP BY

        customers.id,
        customers.name,
        customers.email,
        customers.phone,
        customers.pan_number

      ORDER BY customers.created_at DESC
      `
    );

    return res.json({

      success: true,

      folders: result.rows,

    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({

      success: false,
      error: error.message,

    });
  }
};



// ==========================================
// GET ALL MEMBER FILINGS OF CUSTOMER
// ==========================================
export const getCustomerFilings =
async (req, res) => {

  try {

    const { customerId } = req.params;

    const result =
    await getPool().query(

      `
      SELECT

        filings.*,

        members.full_name AS member_name,
        members.pan_number AS member_pan,
        members.phone AS member_phone,
        members.email AS member_email,
        members.relationship AS relationship,

        COUNT(documents.id)
        AS document_count

      FROM filings

      LEFT JOIN members
      ON filings.member_id = members.id

      LEFT JOIN documents
      ON filings.id = documents.filing_id

      WHERE filings.customer_id = $1

      GROUP BY

        filings.id,
        members.id

      ORDER BY filings.created_at DESC
      `,

      [customerId]
    );

    return res.json({

      success: true,

      filings: result.rows,

    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({

      success: false,
      error: error.message,

    });
  }
};



// ==========================================
// GET DOCUMENTS OF SINGLE FILING
// ==========================================
export const getDocumentsByFiling =
async (req, res) => {

  try {

    const { filingId } = req.params;

    const filingResult =
    await getPool().query(
      `SELECT * FROM filings WHERE id = $1`,
      [filingId]
    );

    if (filingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Filing not found",
      });
    }

    const documentsResult =
    await getPool().query(
      `SELECT * FROM documents WHERE filing_id = $1 ORDER BY created_at DESC`,
      [filingId]
    );

    return res.json({
      success   : true,
      filing    : filingResult.rows[0],
      documents : documentsResult.rows,
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};



// ==========================================
// DELETE DOCUMENT
// ==========================================
export const deleteDocument =
async (req, res) => {

  try {

    const { documentId } = req.params;

    // 1. Fetch the document row so we can get the Cloudinary URL
    const docResult =
    await getPool().query(
      `SELECT * FROM documents WHERE id = $1`,
      [documentId]
    );

    if (docResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    const doc = docResult.rows[0];

    // 2. Delete from Cloudinary if a file_url exists
    if (doc.file_url) {
      try {
        // Extract the public_id from the Cloudinary URL
        // URL format: https://res.cloudinary.com/<cloud>/image/upload/v123456/folder/public_id.ext
        const urlParts   = doc.file_url.split("/");
        const uploadIndex = urlParts.indexOf("upload");

        if (uploadIndex !== -1) {
          // Everything after "upload/v<version>/" is the public_id (with extension)
          const afterUpload  = urlParts.slice(uploadIndex + 2).join("/");
          const publicId     = afterUpload.replace(/\.[^/.]+$/, ""); // strip extension

          await cloudinary.uploader.destroy(publicId, {
            resource_type: "auto",
            invalidate   : true,
          });
        }
      } catch (cloudinaryError) {
        // Log but don't fail — still delete from DB
        console.log("Cloudinary delete warning:", cloudinaryError.message);
      }
    }

    // 3. Delete from database
    await getPool().query(
      `DELETE FROM documents WHERE id = $1`,
      [documentId]
    );

    return res.json({
      success: true,
      message: "Document deleted successfully",
    });

  } catch (error) {

    console.log("DELETE DOCUMENT ERROR:", error);

    return res.status(500).json({
      success: false,
      error  : error.message,
    });
  }
};