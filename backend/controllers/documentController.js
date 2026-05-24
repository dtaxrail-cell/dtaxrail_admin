import { getPool } from "../config/db.js";

export const getDocumentFolders = async (req, res) => {

  try {

    const result = await getPool().query(`
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
    `);

    res.json({
      success: true,
      folders: result.rows,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};