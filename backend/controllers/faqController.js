import { getPool } from "../config/db.js";



// ==========================================
// GET ACTIVE FAQS (CUSTOMER APP)
// ==========================================
export const getFaqs = async (req, res) => {

  try {

    const result =
    await getPool().query(`

      SELECT *

      FROM faqs

      WHERE is_active = true

      ORDER BY created_at DESC

    `);

    return res.json({

      success: true,

      faqs: result.rows,

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
// GET ALL FAQS (ADMIN)
// ==========================================
export const getAdminFaqs = async (req, res) => {

  try {

    const result =
    await getPool().query(`

      SELECT *

      FROM faqs

      ORDER BY created_at DESC

    `);

    return res.json({

      success: true,

      faqs: result.rows,

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
// CREATE FAQ
// ==========================================
export const createFaq = async (req, res) => {

  try {

    const {
      question,
      answer,
    } = req.body;

    const result =
    await getPool().query(

      `
      INSERT INTO faqs (

        question,
        answer

      )

      VALUES (

        $1,
        $2

      )

      RETURNING *
      `,

      [
        question,
        answer,
      ]
    );

    return res.status(201).json({

      success: true,

      faq:
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
// UPDATE FAQ
// ==========================================
export const updateFaq = async (req, res) => {

  try {

    const { faqId } =
    req.params;

    const {
      question,
      answer,
      is_active,
    } = req.body;

    const existingFaq =
await getPool().query(
  `
  SELECT *
  FROM faqs
  WHERE id = $1
  `,
  [faqId]
);

if (existingFaq.rows.length === 0) {

  return res.status(404).json({
    success: false,
    message: "FAQ not found",
  });

}

const faq =
existingFaq.rows[0];

const result =
await getPool().query(
  `
  UPDATE faqs
  SET
    question = $1,
    answer = $2,
    is_active = $3,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = $4
  RETURNING *
  `,
  [
    question ?? faq.question,
    answer ?? faq.answer,
    is_active ?? faq.is_active,
    faqId,
  ]
);

    return res.json({

      success: true,

      faq:
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