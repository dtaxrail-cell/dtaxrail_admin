import { getPool } from "../config/db.js";

export const getCustomers = async (req, res) => {
  try {
    const result = await getPool().query(`
      SELECT *
      FROM customers
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      count: result.rows.length,
      customers: result.rows,
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/*export const createCustomer = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
    } = req.body;

    const result = await getPool().query(
      `
      INSERT INTO customers (
        name,
        email,
        phone
      )
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [name, email, phone]
    );

    res.status(201).json({
      success: true,
      customer: result.rows[0],
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};*/