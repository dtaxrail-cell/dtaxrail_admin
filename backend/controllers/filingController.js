import { getPool } from "../config/db.js";



// GET ALL FILINGS (ADMIN)
export const getFilings = async (req, res) => {

  try {

    const result = await getPool().query(`

      SELECT

        filings.*,

        customers.name AS customer_name,
        customers.email AS customer_email,
        customers.phone AS customer_phone,

        members.full_name AS member_name,
        members.pan_number AS member_pan,
        members.relationship AS relationship

      FROM filings

      LEFT JOIN customers
      ON filings.customer_id = customers.id

      LEFT JOIN members
      ON filings.member_id = members.id

      ORDER BY filings.created_at DESC

    `);

    res.json({

      success: true,

      count:
      result.rows.length,

      filings:
      result.rows,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({

      success: false,
      error: error.message,
    });
  }
};



// CREATE FILING
export const createFiling = async (req, res) => {

  try {

    const {

      filing_type,
      assessment_year,
      notes,

      member_id,

    } = req.body;

    const { email } = req.user;





    // FIND CUSTOMER
    const customerResult =
    await getPool().query(

      `
      SELECT *
      FROM customers
      WHERE email = $1
      `,

      [email]
    );

    if (
      customerResult.rows.length === 0
    ) {

      return res.status(404).json({

        success: false,

        message:
        "Customer not found",

      });
    }

    const customer =
    customerResult.rows[0];





    // VERIFY MEMBER
    const memberResult =
    await getPool().query(

      `
      SELECT *
      FROM members
      WHERE id = $1
      `,

      [member_id]
    );

    if (
      memberResult.rows.length === 0
    ) {

      return res.status(404).json({

        success: false,

        message:
        "Member not found",

      });
    }





    // CREATE FILING
    const filingResult =
    await getPool().query(

      `
      INSERT INTO filings (

        customer_id,
        member_id,

        filing_type,
        assessment_year,

        notes,
        status,
        progress

      )

      VALUES (
        $1, $2, $3, $4, $5, $6, $7
      )

      RETURNING *
      `,

      [

        customer.id,
        member_id,

        filing_type,
        assessment_year,

        notes || null,

        "Pending",

        0,

      ]
    );

    return res.status(201).json({

      success: true,

      filing:
      filingResult.rows[0],

    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({

      success: false,
      error: error.message,

    });
  }
};



export const getSingleFiling =
async (req, res) => {

  try {

    const { filingId } = req.params;

    // GET FILING
    const filingResult =
    await getPool().query(

      `
      SELECT

        filings.*,

        customers.name AS customer_name,
        customers.email AS customer_email,
        customers.phone AS customer_phone,

        members.full_name AS member_name,
        members.pan_number AS member_pan,
        members.phone AS member_phone,
        members.email AS member_email,
        members.relationship AS relationship

      FROM filings

      LEFT JOIN customers
      ON filings.customer_id = customers.id

      LEFT JOIN members
      ON filings.member_id = members.id

      WHERE filings.id = $1
      `,

      [filingId]
    );

    if (
      filingResult.rows.length === 0
    ) {

      return res.status(404).json({

        success: false,

        message:
        "Filing not found",

      });
    }






    // GET DOCUMENTS
    const documentsResult =
    await getPool().query(

      `
      SELECT *
      FROM documents
      WHERE filing_id = $1
      ORDER BY created_at DESC
      `,

      [filingId]
    );





    // GET MESSAGES
    const messagesResult =
    await getPool().query(

      `
      SELECT *
      FROM filing_messages
      WHERE filing_id = $1
      ORDER BY created_at DESC
      `,

      [filingId]
    );





    // GET RESULTS
    const resultsResult =
    await getPool().query(

      `
      SELECT *
      FROM filing_results
      WHERE filing_id = $1
      ORDER BY created_at DESC
      `,

      [filingId]
    );

    return res.json({

      success: true,

      filing:
      filingResult.rows[0],

      documents:
      documentsResult.rows,

      messages:
      messagesResult.rows,

      results:
      resultsResult.rows,

    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({

      success: false,
      error: error.message,

    });
  }
};



export const requestAdditionalDocument =
async (req, res) => {

  try {

    const { filingId } = req.params;

    const { message } = req.body;

    // SAVE MESSAGE
    await getPool().query(

      `
      INSERT INTO filing_messages (

        filing_id,
        sender_type,
        message

      )

      VALUES ($1, $2, $3)
      `,

      [
        filingId,
        "admin",
        message,
      ]
    );

    // UPDATE STATUS
    await getPool().query(

      `
      UPDATE filings
      SET status = 'Documents Requested'
      WHERE id = $1
      `,

      [filingId]
    );

    return res.json({

      success: true,
      message: "Request sent",

    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({

      success: false,
      error: error.message,

    });
  }
};


export const updateFilingStatus =
async (req, res) => {

  try {

    const { filingId } = req.params;

    const { status } = req.body;





    // OLD STATUS
    const oldResult =
    await getPool().query(

      `
      SELECT status
      FROM filings
      WHERE id = $1
      `,

      [filingId]
    );

    const oldStatus =
    oldResult.rows[0]?.status;





    // UPDATE
    await getPool().query(

      `
      UPDATE filings
      SET status = $1
      WHERE id = $2
      `,

      [status, filingId]
    );





    // HISTORY
    await getPool().query(

      `
      INSERT INTO filing_status_history (

        filing_id,
        old_status,
        new_status

      )

      VALUES ($1, $2, $3)
      `,

      [
        filingId,
        oldStatus,
        status,
      ]
    );

    return res.json({

      success: true,
      message: "Status updated",

    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({

      success: false,
      error: error.message,

    });
  }
};



export const uploadFilingResult =
async (req, res) => {

  try {

    const { filingId } = req.params;

    const fileUrl =
    req.file.path;

    const fileName =
    req.file.originalname;





    await getPool().query(

      `
      INSERT INTO filing_results (

        filing_id,
        file_name,
        file_url

      )

      VALUES ($1, $2, $3)
      `,

      [
        filingId,
        fileName,
        fileUrl,
      ]
    );





    // UPDATE STATUS
    await getPool().query(

      `
      UPDATE filings
      SET status = 'Completed'
      WHERE id = $1
      `,

      [filingId]
    );

    return res.json({

      success: true,
      message: "Result uploaded",

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
// CUSTOMER GET ALL FILINGS
// ==========================================
export const getCustomerFilingsForApp =
async (req, res) => {

  try {

    const { email } = req.user;





    // FIND CUSTOMER
    const customerResult =
    await getPool().query(

      `
      SELECT *
      FROM customers
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





    // GET FILINGS
    const result =
    await getPool().query(

      `
      SELECT

        filings.*,

        members.full_name AS member_name,
        members.relationship,
        members.pan_number AS member_pan,

        COUNT(DISTINCT documents.id)
        AS document_count,

        COUNT(DISTINCT filing_results.id)
        AS result_count,

        COALESCE(

          (
            SELECT payment_status
            FROM payments
            WHERE payments.filing_id = filings.id
            ORDER BY created_at DESC
            LIMIT 1
          ),

          'Pending'

        ) AS payment_status,

        (
          SELECT message
          FROM filing_messages
          WHERE filing_messages.filing_id = filings.id
          AND sender_type = 'admin'
          ORDER BY created_at DESC
          LIMIT 1
        ) AS latest_admin_message

      FROM filings

      LEFT JOIN members
      ON filings.member_id = members.id

      LEFT JOIN documents
      ON filings.id = documents.filing_id

      LEFT JOIN filing_results
      ON filings.id = filing_results.filing_id

      WHERE filings.customer_id = $1

      GROUP BY

        filings.id,
        members.id

      ORDER BY filings.created_at DESC
      `,

      [customer.id]
    );





    return res.json({

      success: true,

      filings:
      result.rows,

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
// CUSTOMER GET FILING RESULTS
// ==========================================
export const getCustomerFilingResults =
async (req, res) => {

  try {

    const { email } = req.user;

    // FIND CUSTOMER
    const customerResult =
    await getPool().query(

      `
      SELECT *
      FROM customers
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

    // GET RESULTS
    const result =
    await getPool().query(

      `
      SELECT

        filings.id,
        filings.filing_type,
        filings.assessment_year,
        filings.status,

        members.full_name AS member_name,

        filing_results.id AS result_id,
        filing_results.file_name,
        filing_results.file_url,
        filing_results.created_at

      FROM filings

      LEFT JOIN members
      ON filings.member_id = members.id

      LEFT JOIN filing_results
      ON filings.id = filing_results.filing_id

      WHERE filings.customer_id = $1
      AND filing_results.id IS NOT NULL

      ORDER BY filing_results.created_at DESC
      `,

      [customer.id]
    );

    return res.json({

      success: true,

      results:
      result.rows,

    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({

      success: false,
      error: error.message,

    });
  }
};