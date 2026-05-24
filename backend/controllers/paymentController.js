import { getPool } from "../config/db.js";

export const getPayments = async (req, res) => {
  try {

    const result = await getPool().query(`
      SELECT
        payments.*,
        customers.name AS customer_name,
        customers.email AS customer_email,
        customers.phone AS customer_phone,
        filings.filing_type
      FROM payments
      LEFT JOIN customers
        ON payments.customer_id = customers.id
      LEFT JOIN filings
        ON payments.filing_id = filings.id
      ORDER BY payments.created_at DESC
    `);

    res.json({
      success: true,
      count: result.rows.length,
      payments: result.rows,
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const updatePaymentStatus = async (req, res) => {
  try {

    const { id } = req.params;

    const {
      payment_status,
    } = req.body;

    const result = await getPool().query(
      `
      UPDATE payments
      SET
        payment_status = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
      `,
      [payment_status, id]
    );

    res.json({
      success: true,
      message: "Payment status updated",
      payment: result.rows[0],
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};