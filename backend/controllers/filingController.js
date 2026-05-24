import { getPool } from "../config/db.js";

export const getFilings = async (req, res) => {
  try {

    const result = await getPool().query(`
  SELECT
    filings.*,
    customers.name AS customer_name,
    customers.email AS customer_email,
    customers.phone AS customer_phone
  FROM filings
  LEFT JOIN customers
    ON filings.customer_id = customers.id
  ORDER BY filings.created_at DESC
`);

    res.json({
      success: true,
      count: result.rows.length,
      filings: result.rows,
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};