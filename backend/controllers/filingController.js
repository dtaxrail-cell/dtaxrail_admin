import { getPool } from "../config/db.js";



// GET ALL FILINGS (ADMIN)
export const getFilings = async (req, res) => {

  try {

    const result = await getPool().query(`
      SELECT
        filings.*,

        customers.name AS customer_name,
        customers.email AS customer_email,
        customers.phone AS customer_phone

      FROM filings

      LEFT JOIN customers
      ON filings.customer_id = customers.id

      ORDER BY filings.created_at DESC
    `);

    res.json({
      success: true,
      count: result.rows.length,
      filings: result.rows,
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

      member_name,
      member_pan,
      member_phone,
      member_email,
      relationship,

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
        message: "Customer not found",

      });
    }

    const customer =
    customerResult.rows[0];







    // CREATE FILING
    const filingResult =
    await getPool().query(

      `
      INSERT INTO filings (

        customer_id,

        filing_type,
        assessment_year,

        notes,
        status,
        progress,

        member_name,
        member_pan,
        member_phone,
        member_email,
        relationship

      )

      VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10, $11
      )

      RETURNING *
      `,

      [

        customer.id,

        filing_type,
        assessment_year,

        notes || null,
        "Pending",
        0,

        member_name,
        member_pan,
        member_phone,
        member_email,
        relationship,

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
        customers.phone AS customer_phone

      FROM filings

      LEFT JOIN customers
      ON filings.customer_id = customers.id

      WHERE filings.id = $1
      `,

      [filingId]
    );

    if (filingResult.rows.length === 0) {

      return res.status(404).json({

        success: false,
        message: "Filing not found",

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