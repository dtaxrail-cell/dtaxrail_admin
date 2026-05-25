import { getPool } from "../config/db.js";



// GET ALL DOCUMENT FOLDERS
export const getDocumentFolders =
async (req, res) => {

  try {

    const result =
    await getPool().query(

      `
      SELECT

        filings.id,
        filings.status,

        customers.name AS customer_name,
        customers.pan_number,

        COUNT(documents.id) AS document_count

      FROM filings

      LEFT JOIN customers
      ON filings.customer_id = customers.id

      LEFT JOIN documents
      ON filings.id = documents.filing_id

      GROUP BY

        filings.id,
        filings.status,

        customers.name,
        customers.pan_number

      ORDER BY filings.created_at DESC
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







// GET SINGLE FILING DOCUMENTS
export const getDocumentsByFiling =
async (req, res) => {

  try {

    const { filingId } = req.params;






    // GET FILING + CUSTOMER
    const filingResult =
    await getPool().query(

      `
      SELECT

        filings.*,

        customers.name AS customer_name,
        customers.email AS customer_email,
        customers.phone AS customer_phone,
        customers.pan_number

      FROM filings

      LEFT JOIN customers
      ON filings.customer_id = customers.id

      WHERE filings.id = $1
      `,

      [filingId]
    );






    if (
      filingResult.rows.length === 0
    ) {

      return res.status(404).json({

        success: false,
        message: "Filing not found",

      });
    }







    // GET DOCUMENTS
    const documentsResult =
    await getPool().query(

      `
      SELECT *

      FROM documents

      WHERE filing_id = $1

      ORDER BY created_at DESC
      `,

      [filingId]
    );







    return res.json({

      success: true,

      filing:
      filingResult.rows[0],

      documents:
      documentsResult.rows,

    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({

      success: false,
      error: error.message,

    });
  }
};