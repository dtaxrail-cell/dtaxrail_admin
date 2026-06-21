import { getPool } from "../config/db.js";

// ==========================================
// GET SHEET LAYOUT
// ==========================================
export const getSheetLayout = async (req, res) => {
  try {
    const result = await getPool().query(
      `SELECT layout FROM filing_sheet_layout WHERE id = 1`
    );

    const layout = result.rows[0]?.layout ?? {};

    return res.json({ success: true, layout });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ==========================================
// SAVE SHEET LAYOUT — stores full FortuneSheet snapshot
// ==========================================
export const saveSheetLayout = async (req, res) => {
  try {
    const { layout } = req.body;

    if (!layout || typeof layout !== "object") {
      return res.status(400).json({ success: false, message: "layout object is required" });
    }

    await getPool().query(
      `INSERT INTO filing_sheet_layout (id, layout, updated_at)
       VALUES (1, $1::jsonb, CURRENT_TIMESTAMP)
       ON CONFLICT (id) DO UPDATE
       SET layout = $1::jsonb, updated_at = CURRENT_TIMESTAMP`,
      [JSON.stringify(layout)]
    );

    return res.json({ success: true });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, error: error.message });
  }
};