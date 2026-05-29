import { getPool } from "../config/db.js";



// ==========================================
// CREATE CALLBACK
// ==========================================
export const createCallback = async (req, res) => {

  try {

    const {
      phone,
      preferred_time,
      issue,
    } = req.body;

    const { email } = req.user;

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

    const result =
    await getPool().query(

      `
      INSERT INTO callbacks (

        customer_id,
        phone,
        preferred_time,
        issue,
        status

      )

      VALUES (
        $1, $2, $3, $4, $5
      )

      RETURNING *
      `,

      [

        customer.id,
        phone,
        preferred_time,
        issue,
        "Pending",

      ]
    );

    return res.status(201).json({

      success: true,

      callback:
      result.rows[0],

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
// GET ALL CALLBACKS
// ==========================================
export const getCallbacks = async (req, res) => {

  try {

    const result =
    await getPool().query(`

      SELECT

        callbacks.*,

        customers.name
        AS customer_name,

        customers.email
        AS customer_email

      FROM callbacks

      LEFT JOIN customers
      ON callbacks.customer_id = customers.id

      ORDER BY callbacks.created_at DESC

    `);

    return res.json({

      success: true,

      count:
      result.rows.length,

      callbacks:
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
// UPDATE CALLBACK STATUS
// ==========================================
export const updateCallbackStatus =
async (req, res) => {

  try {

    const { callbackId } =
    req.params;

    const { status } =
    req.body;

    const result =
    await getPool().query(

      `
      UPDATE callbacks

      SET

        status = $1,
        updated_at =
        CURRENT_TIMESTAMP

      WHERE id = $2

      RETURNING *
      `,

      [
        status,
        callbackId,
      ]
    );

    return res.json({

      success: true,

      callback:
      result.rows[0],

    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({

      success: false,
      error: error.message,

    });
  }
};