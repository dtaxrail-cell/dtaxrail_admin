import { getPool } from "../config/db.js";

export const getCalculatorConfig = async (req, res) => {
  try {

    const result = await getPool().query(
      `
      SELECT *
      FROM tax_tools
      WHERE category = 'calculator'
      AND is_active = true
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

export const updateCalculatorConfig = async (req, res) => {
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
      WHERE category = 'calculator'
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

export const getRegimeConfig = async (req, res) => {
  try {

    const result = await getPool().query(
      `
      SELECT *
      FROM tax_tools
      WHERE category = 'regime'
      AND is_active = true
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

export const updateRegimeConfig = async (req, res) => {
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
      WHERE category = 'regime'
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