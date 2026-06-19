import { getPool } from "../config/db.js";

// ==========================================
// GET ALL FILINGS (ADMIN) — enriched for spreadsheet
// ==========================================
export const getFilings = async (req, res) => {
  try {
    const filingsResult = await getPool().query(`
      SELECT
        filings.id,
        filings.status,
        filings.payment_status,
        filings.custom_fields,
        filings.admin_notes,
        filings.filing_type,
        filings.assessment_year,
        filings.created_at,

        customers.name   AS customer_name,
        customers.email  AS customer_email,
        customers.phone  AS customer_phone,

        members.full_name          AS member_name,
        members.pan_number         AS member_pan,
        members.income_tax_password AS member_password,
        members.phone              AS member_phone,
        members.email              AS member_email,
        members.date_of_birth      AS member_dob,
        members.relationship
      FROM filings
      LEFT JOIN customers
      ON filings.customer_id = customers.id
      LEFT JOIN members
      ON filings.member_id = members.id
      ORDER BY filings.created_at DESC
    `);

    // Fetch custom column definitions
    const columnsResult = await getPool().query(
      `SELECT * FROM filing_custom_columns ORDER BY position ASC, created_at ASC`
    );

    res.json({
      success : true,
      count   : filingsResult.rows.length,
      filings : filingsResult.rows,
      customColumns: columnsResult.rows,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==========================================
// UPDATE FILING STATUS (admin — customer-visible)
// ==========================================
export const updateFilingStatus = async (req, res) => {
  try {
    const { filingId } = req.params;
    const { status }   = req.body;

    const oldResult = await getPool().query(
      `SELECT status FROM filings WHERE id = $1`,
      [filingId]
    );

    const oldStatus = oldResult.rows[0]?.status || '';

    await getPool().query(
      `UPDATE filings SET status = $1 WHERE id = $2`,
      [String(status), filingId]
    );

    await getPool().query(
      `INSERT INTO filing_status_history (filing_id, old_status, new_status)
       VALUES ($1, $2, $3)`,
      [filingId, oldStatus, String(status)]
    );

    return res.json({ success: true, message: "Status updated" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ==========================================
// UPDATE PAYMENT STATUS (admin — customer-visible)
// ==========================================
export const updatePaymentStatusInline = async (req, res) => {
  try {
    const { filingId }     = req.params;
    const { payment_status } = req.body;

    // ✅ Explicit typecast to prevent query parsing driver warnings
    await getPool().query(
      `UPDATE filings SET payment_status = $1 WHERE id = $2`,
      [String(payment_status), filingId]
    );

    const filingResult = await getPool().query(
      `SELECT customer_id FROM filings WHERE id = $1`,
      [filingId]
    );

    if (filingResult.rows.length > 0) {
      const customerId = filingResult.rows[0].customer_id;

      const existing = await getPool().query(
        `SELECT id FROM payments WHERE filing_id = $1`,
        [filingId]
      );

      if (existing.rows.length > 0) {
        await getPool().query(
          `UPDATE payments
           SET payment_status = $1, updated_at = CURRENT_TIMESTAMP
           WHERE filing_id = $2`,
          [String(payment_status), filingId]
        );
      } else {
        await getPool().query(
          `INSERT INTO payments (customer_id, filing_id, payment_status, payment_date)
           VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
          [customerId, filingId, String(payment_status)]
        );
      }
    }

    return res.json({ success: true });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ==========================================
// UPDATE CUSTOM FIELD VALUE for a single filing cell
// ==========================================
export const updateCustomField = async (req, res) => {
  try {
    const { filingId } = req.params;
    const { field_key, value } = req.body;

    await getPool().query(
      `UPDATE filings
       SET custom_fields = COALESCE(custom_fields, '{}') || jsonb_build_object($1::text, $2::text)
       WHERE id = $3`,
      [field_key, value, filingId]
    );

    return res.json({ success: true });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ==========================================
// ADD CUSTOM COLUMN DEFINITION
// ==========================================
export const addCustomColumn = async (req, res) => {
  try {
    const { label } = req.body;

    if (!label || label.trim() === "") {
      return res.status(400).json({ success: false, message: "Label is required" });
    }

    const field_key = label.trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");

    const result = await getPool().query(
      `INSERT INTO filing_custom_columns (label, field_key)
       VALUES ($1, $2)
       ON CONFLICT (field_key) DO UPDATE SET label = EXCLUDED.label
       RETURNING *`,
      [label.trim(), field_key]
    );

    return res.status(201).json({ success: true, column: result.rows[0] });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ==========================================
// DELETE CUSTOM COLUMN
// ==========================================
export const deleteCustomColumn = async (req, res) => {
  try {
    const { fieldKey } = req.params;

    await getPool().query(
      `DELETE FROM filing_custom_columns WHERE field_key = $1`,
      [fieldKey]
    );

    await getPool().query(
      `UPDATE filings SET custom_fields = custom_fields - $1`,
      [fieldKey]
    );

    return res.json({ success: true });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ==========================================
// CREATE FILING (customer-facing)
// ==========================================
export const createFiling = async (req, res) => {
  try {
    const { filing_type, assessment_year, notes, member_id } = req.body;
    const { email } = req.user;

    let formattedYear = assessment_year;
    if (assessment_year && assessment_year.match(/^\d{4}-\d{2}$/)) {
      const parts = assessment_year.split('-');
      const startYear = parts[0];
      const endYearShort = parts[1];
      const century = startYear.substring(0, 2);
      formattedYear = `${startYear}-${century}${endYearShort}`;
    }

    const customerResult = await getPool().query(
      `SELECT * FROM customers WHERE email = $1`,
      [email]
    );

    if (customerResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    const customer = customerResult.rows[0];

    const memberResult = await getPool().query(
      `SELECT * FROM members WHERE id = $1`,
      [member_id]
    );

    if (memberResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Member not found" });
    }

    const filingResult = await getPool().query(
      `INSERT INTO filings
         (customer_id, member_id, filing_type, assessment_year, notes, status, progress, payment_status, custom_fields)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
       RETURNING *`,
      [customer.id, member_id, filing_type, formattedYear, notes || null, "Pending", 0, "Unpaid", '{}']
    );

    return res.status(201).json({ success: true, filing: filingResult.rows[0] });
  } catch (error) {
    console.error("Filing Creation Error Details:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ==========================================
// GET SINGLE FILING (admin workspace)
// ==========================================
export const getSingleFiling = async (req, res) => {
  try {
    const { filingId } = req.params;

    const filingResult = await getPool().query(
      `SELECT
         filings.*,
         customers.name  AS customer_name,
         customers.email AS customer_email,
         customers.phone AS customer_phone,
         members.full_name          AS member_name,
         members.pan_number         AS member_pan,
         members.income_tax_password AS member_password,
         members.phone              AS member_phone,
         members.email              AS member_email,
         members.relationship
       FROM filings
       LEFT JOIN customers ON filings.customer_id = customers.id
       LEFT JOIN members   ON filings.member_id   = members.id
       WHERE filings.id = $1`,
      [filingId]
    );

    if (filingResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Filing not found" });
    }

    const documentsResult = await getPool().query(
      `SELECT * FROM documents WHERE filing_id = $1 ORDER BY created_at DESC`,
      [filingId]
    );

    const messagesResult = await getPool().query(
      `SELECT * FROM filing_messages WHERE filing_id = $1 ORDER BY created_at DESC`,
      [filingId]
    );

    const resultsResult = await getPool().query(
      `SELECT * FROM filing_results WHERE filing_id = $1 ORDER BY created_at DESC`,
      [filingId]
    );

    return res.json({
      success   : true,
      filing    : filingResult.rows[0],
      documents : documentsResult.rows,
      messages  : messagesResult.rows,
      results   : resultsResult.rows,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ==========================================
// REQUEST ADDITIONAL DOCUMENTS (admin)
// ==========================================
export const requestAdditionalDocument = async (req, res) => {
  try {
    const { filingId } = req.params;
    const { message }  = req.body;

    await getPool().query(
      `INSERT INTO filing_messages (filing_id, sender_type, message) VALUES ($1, $2, $3)`,
      [filingId, "admin", message]
    );

    await getPool().query(
      `UPDATE filings SET status = 'Documents Requested' WHERE id = $1`,
      [filingId]
    );

    return res.json({ success: true, message: "Request sent" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ==========================================
// UPLOAD FILING RESULT (admin)
// ==========================================
export const uploadFilingResult = async (req, res) => {
  try {
    const { filingId } = req.params;
    const fileUrl  = req.file.path;
    const fileName = req.file.originalname;

    await getPool().query(
      `INSERT INTO filing_results (filing_id, file_name, file_url) VALUES ($1, $2, $3)`,
      [filingId, fileName, fileUrl]
    );

    await getPool().query(
      `UPDATE filings SET status = 'Completed' WHERE id = $1`,
      [filingId]
    );

    return res.json({ success: true, message: "Result uploaded" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ==========================================
// CUSTOMER — GET ALL FILINGS
// ==========================================
export const getCustomerFilingsForApp = async (req, res) => {
  try {
    const { email } = req.user;

    const customerResult = await getPool().query(
      `SELECT * FROM customers WHERE email = $1`,
      [email]
    );

    if (customerResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    const customer = customerResult.rows[0];

    const result = await getPool().query(
      `SELECT
         filings.id,
         filings.filing_type,
         filings.assessment_year,
         filings.status,
         filings.payment_status,
         filings.admin_notes,
         members.full_name  AS member_name,
         members.relationship,
         members.pan_number AS member_pan,
         COUNT(DISTINCT documents.id)      AS document_count,
         COUNT(DISTINCT filing_results.id) AS result_count,
         (
           SELECT message FROM filing_messages
           WHERE filing_messages.filing_id = filings.id
             AND sender_type = 'admin'
           ORDER BY created_at DESC LIMIT 1
         ) AS latest_admin_message
       FROM filings
       LEFT JOIN members       ON filings.member_id  = members.id
       LEFT JOIN documents     ON filings.id = documents.filing_id
       LEFT JOIN filing_results ON filings.id = filing_results.filing_id
       WHERE filings.customer_id = $1
       GROUP BY filings.id, members.id
       ORDER BY filings.created_at DESC`,
      [customer.id]
    );

    return res.json({ success: true, filings: result.rows });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ==========================================
// CUSTOMER — GET FILING RESULTS
// ==========================================
export const getCustomerFilingResults = async (req, res) => {
  try {
    const { email } = req.user;

    const customerResult = await getPool().query(
      `SELECT * FROM customers WHERE email = $1`,
      [email]
    );

    if (customerResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    const customer = customerResult.rows[0];

    const result = await getPool().query(
      `SELECT
         filings.id,
         filings.filing_type,
         filings.assessment_year,
         filings.status,
         members.full_name AS member_name,
         filing_results.id         AS result_id,
         filing_results.file_name,
         filing_results.file_url,
         filing_results.created_at
       FROM filings
       LEFT JOIN members        ON filings.member_id = members.id
       LEFT JOIN filing_results ON filings.id = filing_results.filing_id
       WHERE filings.customer_id = $1
         AND filing_results.id IS NOT NULL
       ORDER BY filing_results.created_at DESC`,
      [customer.id]
    );

    return res.json({ success: true, results: result.rows });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, error: error.message });
  }
};