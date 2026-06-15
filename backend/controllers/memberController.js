import { getPool } from "../config/db.js";



// ==========================================
// CREATE MEMBER
// ==========================================
export const createMember =
async (req, res) => {

  try {

    console.log("CREATE MEMBER — req.user:", req.user);
    console.log("CREATE MEMBER — req.body:", req.body);

    const {

      full_name,
      pan_number,
      phone,
      email,
      relationship,
      date_of_birth,

    } = req.body;

    const { uid } = req.user;

    // ── Validate mandatory fields ─────────────────────────────────────────
    if (!phone || phone.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }
    if (!relationship || relationship.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Relationship is required",
      });
    }

    // ── Find customer by firebase_uid ─────────────────────────────────────
    const customerResult =
    await getPool().query(
      `SELECT * FROM customers WHERE firebase_uid = $1`,
      [uid]
    );

    console.log("CREATE MEMBER — customer lookup rows:", customerResult.rows.length);

    if (customerResult.rows.length === 0) {

      // ── Fallback: try by email (in case uid not stored) ──────────────
      const emailFromToken = req.user.email;
      console.log("CREATE MEMBER — fallback email lookup:", emailFromToken);

      if (emailFromToken) {
        const byEmail = await getPool().query(
          `SELECT * FROM customers WHERE email = $1`,
          [emailFromToken]
        );

        if (byEmail.rows.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Customer not found (tried uid + email)",
          });
        }

        const customer = byEmail.rows[0];
        return await _insertMember(res, customer.id, {
          full_name, pan_number, phone, email, relationship, date_of_birth,
        });
      }

      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const customer = customerResult.rows[0];
    return await _insertMember(res, customer.id, {
      full_name, pan_number, phone, email, relationship, date_of_birth,
    });

  } catch (error) {

    console.log("CREATE MEMBER ERROR:", error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ── Shared insert helper ──────────────────────────────────────────────────────
async function _insertMember(res, customerId, fields) {

  const { full_name, pan_number, phone, email, relationship, date_of_birth } = fields;

  const normName  = full_name     && full_name.trim()     !== "" ? full_name.trim()     : null;
  const normPan   = pan_number    && pan_number.trim()    !== "" ? pan_number.trim()    : null;
  const normEmail = email         && email.trim()         !== "" ? email.trim()         : null;
  const normDob   = date_of_birth && date_of_birth.trim() !== "" ? date_of_birth.trim() : null;

  const result = await getPool().query(
    `
    INSERT INTO members (
      customer_id,
      full_name,
      pan_number,
      phone,
      email,
      relationship,
      date_of_birth
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
    `,
    [customerId, normName, normPan, phone.trim(), normEmail, relationship.trim(), normDob]
  );

  console.log("CREATE MEMBER — inserted:", result.rows[0]);

  return res.status(201).json({
    success: true,
    member: result.rows[0],
  });
}



// ==========================================
// GET MEMBERS
// ==========================================
export const getMembers =
async (req, res) => {

  try {

    const { uid } = req.user;

    const customerResult =
    await getPool().query(
      `SELECT * FROM customers WHERE firebase_uid = $1`,
      [uid]
    );

    if (customerResult.rows.length === 0) {

      // Fallback by email
      const emailFromToken = req.user.email;
      if (emailFromToken) {
        const byEmail = await getPool().query(
          `SELECT * FROM customers WHERE email = $1`,
          [emailFromToken]
        );
        if (byEmail.rows.length === 0) {
          return res.status(404).json({ success: false, message: "Customer not found" });
        }
        const customer = byEmail.rows[0];
        return await _getMembers(res, customer.id);
      }

      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    const customer = customerResult.rows[0];
    return await _getMembers(res, customer.id);

  } catch (error) {

    console.log(error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

async function _getMembers(res, customerId) {
  const result = await getPool().query(
    `SELECT * FROM members WHERE customer_id = $1 ORDER BY created_at DESC`,
    [customerId]
  );
  return res.json({ success: true, members: result.rows });
}



// ==========================================
// UPDATE MEMBER
// ==========================================
export const updateMember =
async (req, res) => {

  try {

    const { memberId } = req.params;

    const {
      full_name,
      pan_number,
      phone,
      email,
      relationship,
      date_of_birth,
    } = req.body;

    if (!phone || phone.trim() === "") {
      return res.status(400).json({ success: false, message: "Phone number is required" });
    }
    if (!relationship || relationship.trim() === "") {
      return res.status(400).json({ success: false, message: "Relationship is required" });
    }

    const normName  = full_name     && full_name.trim()     !== "" ? full_name.trim()     : null;
    const normPan   = pan_number    && pan_number.trim()    !== "" ? pan_number.trim()    : null;
    const normEmail = email         && email.trim()         !== "" ? email.trim()         : null;
    const normDob   = date_of_birth && date_of_birth.trim() !== "" ? date_of_birth.trim() : null;

    const result = await getPool().query(
      `
      UPDATE members
      SET
        full_name     = $1,
        pan_number    = $2,
        phone         = $3,
        email         = $4,
        relationship  = $5,
        date_of_birth = $6
      WHERE id = $7
      RETURNING *
      `,
      [normName, normPan, phone.trim(), normEmail, relationship.trim(), normDob, memberId]
    );

    return res.json({ success: true, member: result.rows[0] });

  } catch (error) {

    console.log(error);
    return res.status(500).json({ success: false, error: error.message });
  }
};



// ==========================================
// DELETE MEMBER
// ==========================================
export const deleteMember =
async (req, res) => {

  const client = await getPool().connect();

  try {

    await client.query("BEGIN");

    const { memberId } = req.params;

    const filingsResult = await client.query(
      `SELECT id FROM filings WHERE member_id = $1`,
      [memberId]
    );

    for (const filing of filingsResult.rows) {
      const filingId = filing.id;
      await client.query(`DELETE FROM filing_results       WHERE filing_id = $1`, [filingId]);
      await client.query(`DELETE FROM filing_messages      WHERE filing_id = $1`, [filingId]);
      await client.query(`DELETE FROM filing_status_history WHERE filing_id = $1`, [filingId]);
      await client.query(`DELETE FROM documents            WHERE filing_id = $1`, [filingId]);
    }

    await client.query(`DELETE FROM filings WHERE member_id = $1`, [memberId]);
    await client.query(`DELETE FROM members WHERE id = $1`,        [memberId]);

    await client.query("COMMIT");

    return res.json({ success: true, message: "Member deleted successfully" });

  } catch (error) {

    await client.query("ROLLBACK");
    console.log(error);
    return res.status(500).json({ success: false, error: error.message });

  } finally {

    client.release();
  }
};