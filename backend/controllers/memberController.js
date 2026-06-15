import { getPool } from "../config/db.js";



// ==========================================
// CREATE MEMBER
// ==========================================
export const createMember =
async (req, res) => {

  try {

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

    const customerResult =
    await getPool().query(

      `
      SELECT *
      FROM customers
      WHERE firebase_uid = $1
      `,

      [uid]
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

    // ── Normalise optional fields: empty string → null ────────────────────
    const normName  = full_name     && full_name.trim()     !== "" ? full_name.trim()     : null;
    const normPan   = pan_number    && pan_number.trim()    !== "" ? pan_number.trim()    : null;
    const normEmail = email         && email.trim()         !== "" ? email.trim()         : null;
    const normDob   = date_of_birth && date_of_birth.trim() !== "" ? date_of_birth.trim() : null;

    const result =
    await getPool().query(

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

      VALUES (
        $1, $2, $3, $4, $5, $6, $7
      )

      RETURNING *
      `,

      [

        customer.id,

        normName,
        normPan,
        phone.trim(),
        normEmail,
        relationship.trim(),
        normDob,

      ]
    );

    return res.status(201).json({

      success: true,
      member: result.rows[0],

    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({

      success: false,
      error: error.message,

    });
  }
};



// ==========================================
// GET MEMBERS
// ==========================================
export const getMembers =
async (req, res) => {

  try {

    const { uid } = req.user;

    const customerResult =
    await getPool().query(

      `
      SELECT *
      FROM customers
      WHERE firebase_uid = $1
      `,

      [uid]
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



    const result =
    await getPool().query(

      `
      SELECT *
      FROM members
      WHERE customer_id = $1
      ORDER BY created_at DESC
      `,

      [customer.id]
    );

    return res.json({

      success: true,
      members: result.rows,

    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({

      success: false,
      error: error.message,

    });
  }
};



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

    // ── Normalise optional fields: empty string → null ────────────────────
    const normName  = full_name     && full_name.trim()     !== "" ? full_name.trim()     : null;
    const normPan   = pan_number    && pan_number.trim()    !== "" ? pan_number.trim()    : null;
    const normEmail = email         && email.trim()         !== "" ? email.trim()         : null;
    const normDob   = date_of_birth && date_of_birth.trim() !== "" ? date_of_birth.trim() : null;

    const result =
    await getPool().query(

      `
      UPDATE members

      SET

        full_name = $1,
        pan_number = $2,
        phone = $3,
        email = $4,
        relationship = $5,
        date_of_birth = $6

      WHERE id = $7

      RETURNING *
      `,

      [

        normName,
        normPan,
        phone.trim(),
        normEmail,
        relationship.trim(),
        normDob,

        memberId,

      ]
    );

    return res.json({

      success: true,
      member: result.rows[0],

    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({

      success: false,
      error: error.message,

    });
  }
};



// ==========================================
// DELETE MEMBER
// ==========================================
export const deleteMember =
async (req, res) => {

  const client =
  await getPool().connect();

  try {

    await client.query("BEGIN");

    const { memberId } =
    req.params;



    // GET FILINGS
    const filingsResult =
    await client.query(

      `
      SELECT id
      FROM filings
      WHERE member_id = $1
      `,

      [memberId]
    );

    const filings =
    filingsResult.rows;



    // DELETE ALL RELATED DATA
    for (const filing of filings) {

      const filingId =
      filing.id;



      await client.query(

        `
        DELETE FROM filing_results
        WHERE filing_id = $1
        `,

        [filingId]
      );



      await client.query(

        `
        DELETE FROM filing_messages
        WHERE filing_id = $1
        `,

        [filingId]
      );



      await client.query(

        `
        DELETE FROM filing_status_history
        WHERE filing_id = $1
        `,

        [filingId]
      );



      await client.query(

        `
        DELETE FROM documents
        WHERE filing_id = $1
        `,

        [filingId]
      );
    }



    // DELETE FILINGS
    await client.query(

      `
      DELETE FROM filings
      WHERE member_id = $1
      `,

      [memberId]
    );



    // DELETE MEMBER
    await client.query(

      `
      DELETE FROM members
      WHERE id = $1
      `,

      [memberId]
    );



    await client.query("COMMIT");

    return res.json({

      success: true,
      message: "Member deleted successfully",

    });

  } catch (error) {

    await client.query("ROLLBACK");

    console.log(error);

    return res.status(500).json({

      success: false,
      error: error.message,

    });

  } finally {

    client.release();
  }
};