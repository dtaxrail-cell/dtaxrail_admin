import { getPool } from "../config/db.js";

export const getTaxTools = async (req, res) => {
  try {

    const result = await getPool().query(
      `
      SELECT *
      FROM tax_tools
      WHERE is_active = true
      LIMIT 1
      `
    );

    res.json({
      success: true,
      taxTools: result.rows[0] || null,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const updateTaxTools = async (req, res) => {
  try {

    const {
      title,
      content,
      metadata,
    } = req.body;

    const result = await getPool().query(
      `
      UPDATE tax_tools
      SET
        title = $1,
        content = $2,
        metadata = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE is_active = true
      RETURNING *
      `,
      [
        title,
        content,
        metadata,
      ]
    );

    res.json({
      success: true,
      taxTools: result.rows[0],
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};