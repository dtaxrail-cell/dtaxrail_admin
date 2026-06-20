import { getPool } from "../config/db.js";



// ==========================================
// GET ACTIVE DEADLINES (CUSTOMER APP)
// ==========================================
export const getDeadlines = async (req, res) => {

  try {

    const result = await getPool().query(`
      SELECT id, title, date, is_active
      FROM deadlines
      WHERE is_active = true
      ORDER BY date ASC
    `);

    return res.json({ success: true, deadlines: result.rows });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, error: error.message });
  }
};



// ==========================================
// GET ALL DEADLINES (ADMIN)
// ==========================================
export const getAdminDeadlines = async (req, res) => {

  try {

    const result = await getPool().query(`
      SELECT id, title, date, is_active, created_at, updated_at
      FROM deadlines
      ORDER BY date ASC
    `);

    return res.json({ success: true, deadlines: result.rows });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, error: error.message });
  }
};



// ==========================================
// CREATE DEADLINE (ADMIN)
// ==========================================
export const createDeadline = async (req, res) => {

  try {

    const { title, date } = req.body;

    if (!title || !date) {
      return res.status(400).json({ success: false, message: "Title and date are required" });
    }

    const result = await getPool().query(
      `INSERT INTO deadlines (title, date)
       VALUES ($1, $2)
       RETURNING id, title, date, is_active`,
      [title.trim(), date]
    );

    return res.status(201).json({ success: true, deadline: result.rows[0] });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, error: error.message });
  }
};



// ==========================================
// UPDATE DEADLINE (ADMIN)
// ==========================================
export const updateDeadline = async (req, res) => {

  try {

    const { deadlineId } = req.params;
    const { title, date, is_active } = req.body;

    const existing = await getPool().query(
      `SELECT * FROM deadlines WHERE id = $1`,
      [deadlineId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Deadline not found" });
    }

    const d = existing.rows[0];

    const result = await getPool().query(
      `UPDATE deadlines
       SET
         title      = $1,
         date       = $2,
         is_active  = $3,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING id, title, date, is_active`,
      [
        title     ?? d.title,
        date      ?? d.date,
        is_active ?? d.is_active,
        deadlineId,
      ]
    );

    return res.json({ success: true, deadline: result.rows[0] });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, error: error.message });
  }
};



// ==========================================
// DELETE DEADLINE (ADMIN)
// ==========================================
export const deleteDeadline = async (req, res) => {

  try {

    const { deadlineId } = req.params;

    const existing = await getPool().query(
      `SELECT id FROM deadlines WHERE id = $1`,
      [deadlineId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Deadline not found" });
    }

    await getPool().query(`DELETE FROM deadlines WHERE id = $1`, [deadlineId]);

    return res.json({ success: true, message: "Deadline deleted" });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, error: error.message });
  }
};