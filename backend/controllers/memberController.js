import { getPool } from "../config/db.js";



// CREATE MEMBER
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





    // FIND CUSTOMER
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





    // CREATE MEMBER
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

        full_name,
        pan_number,
        phone,
        email,
        relationship,
        date_of_birth,

      ]
    );

    return res.status(201).json({

      success: true,

      member:
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



// GET MEMBERS
export const getMembers =
async (req, res) => {

  try {

    const { uid } = req.user;





    // FIND CUSTOMER
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





    // GET MEMBERS
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

      members:
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