import { getPool } from "../config/db.js";



// GET ALL FILINGS (ADMIN)
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



// CREATE FILING (CUSTOMER)
export const createFiling = async (req, res) => {

  try {

    const {
      filing_type,
      assessment_year,
      notes,
    } = req.body;

    const { email } = req.user;

    // FIND CUSTOMER
    const customerResult =
    await getPool().query(
      `
      SELECT * FROM customers
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



    // CREATE FILING
    const filingResult =
    await getPool().query(
      `
      INSERT INTO filings (
        customer_id,
        filing_type,
        assessment_year,
        notes,
        status,
        progress
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [
        customer.id,
        filing_type,
        assessment_year,
        notes || null,
        "Pending",
        0,
      ]
    );

    return res.status(201).json({
      success: true,
      filing: filingResult.rows[0],
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};