import { getPool } from "../config/db.js";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import s3Client from "../utils/spaces.js"; // Change from "../config/spaces.js"



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
// GET DOCUMENTS OF SINGLE FILING (ADMIN FETCH)
// ==========================================
export const getDocumentsByFiling = async (req, res) => {
  try {
    const { filingId } = req.params;

    const filingResult = await getPool().query(
      `SELECT * FROM filings WHERE id = $1`,
      [filingId]
    );

    if (filingResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Filing not found" });
    }

    const documentsResult = await getPool().query(
      `SELECT * FROM documents WHERE filing_id = $1 ORDER BY created_at DESC`,
      [filingId]
    );

    const signedDocuments = await Promise.all(
      documentsResult.rows.map(async (doc) => {
        // Fallback safety to intercept both database and runtime casing styles
        const currentUrl = doc.file_url || doc.fileUrl;

        if (currentUrl) {
          try {
            if (currentUrl.includes("digitaloceanspaces.com")) {
              const fileKey = currentUrl.split("digitaloceanspaces.com/")[1];

              const command = new GetObjectCommand({
                Bucket: "dtr-file-storage",
                Key: fileKey,
              });

              // Secure access token valid for 1 hour
              const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

              return {
                ...doc,
                file_url: presignedUrl,
                fileUrl: presignedUrl // Feed both parameters so frontend works perfectly
              };
            }
          } catch (s3Error) {
            console.log(`Failed to sign document ${doc.id}:`, s3Error.message);
          }
        }
        return doc; // Pass through legacy Cloudinary urls unbothered
      })
    );

    return res.json({
      success: true,
      filing: filingResult.rows[0],
      documents: signedDocuments,
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, error: error.message });
  }
};



// ==========================================
// DELETE DOCUMENT
// ==========================================
export const deleteDocument =
async (req, res) => {

  try {

    const { documentId } = req.params;

    // 1. Fetch the document row so we can get the DigitalOcean Spaces URL
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

    // 2. Delete from DigitalOcean Spaces if a file_url exists
    if (doc.file_url) {
      try {
        const bucketUrlString = "https://dtr-file-storage.sgp1.digitaloceanspaces.com/";

        if (doc.file_url.startsWith(bucketUrlString)) {
          const fileKey = doc.file_url.replace(bucketUrlString, "");

          const deleteCommand = new DeleteObjectCommand({
            Bucket: "dtr-file-storage",
            Key: fileKey,
          });

          await s3Client.send(deleteCommand);
        }
      } catch (spacesError) {
        // Log but don't fail — still delete from DB
        console.log("Spaces storage delete warning:", spacesError.message);
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