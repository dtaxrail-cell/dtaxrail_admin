import { getPool } from "../config/db.js";



// ==========================================
// GET ALL PAYMENTS
// ==========================================
export const getPayments = async (req, res) => {

  try {

    const result =
    await getPool().query(`

      SELECT

        payments.*,

        customers.name AS customer_name,

        members.full_name AS member_name,
        members.relationship,
        members.pan_number,
        members.phone,
        members.email,

        filings.assessment_year,
        filings.status AS filing_status

      FROM payments

      LEFT JOIN customers
      ON payments.customer_id = customers.id

      LEFT JOIN filings
      ON payments.filing_id = filings.id

      LEFT JOIN members
      ON filings.member_id = members.id

      ORDER BY payments.created_at DESC
    `);





    return res.json({

      success: true,

      count: result.rows.length,

      payments: result.rows,

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
// UPDATE PAYMENT STATUS
// ==========================================
export const updatePaymentStatus =
async (req, res) => {

  try {

    const { filingId } = req.params;

    const {
      payment_status,
    } = req.body;





    // CHECK EXISTING PAYMENT
    const existingPayment =
    await getPool().query(

      `
      SELECT *
      FROM payments
      WHERE filing_id = $1
      `,

      [filingId]
    );





    // GET FILING
    const filingResult =
    await getPool().query(

      `
      SELECT *
      FROM filings
      WHERE id = $1
      `,

      [filingId]
    );





    if (
      filingResult.rows.length === 0
    ) {

      return res.status(404).json({

        success: false,
        message: "Filing not found",

      });
    }

    const filing =
    filingResult.rows[0];





    let payment;





    // UPDATE EXISTING PAYMENT
    if (
      existingPayment.rows.length > 0
    ) {

      const updateResult =
      await getPool().query(

        `
        UPDATE payments

        SET

          payment_status = $1,
          payment_date = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP

        WHERE filing_id = $2

        RETURNING *
        `,

        [
          payment_status,
          filingId,
        ]
      );

      payment =
      updateResult.rows[0];
    }






    // CREATE NEW PAYMENT
    else {

      const insertResult =
      await getPool().query(

        `
        INSERT INTO payments (

          customer_id,
          filing_id,
          payment_status,
          payment_date

        )

        VALUES (
          $1, $2, $3, CURRENT_TIMESTAMP
        )

        RETURNING *
        `,

        [

          filing.customer_id,
          filingId,
          payment_status,

        ]
      );

      payment =
      insertResult.rows[0];
    }






    return res.json({

      success: true,

      message:
      "Payment status updated successfully",

      payment,

    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({

      success: false,
      error: error.message,

    });
  }
};