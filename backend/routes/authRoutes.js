import express from "express";

import authMiddleware
from "../middleware/authMiddleware.js";

import { getPool }
from "../config/db.js";

const router = express.Router();


// SYNC CUSTOMER
router.post(
  "/sync-customer",
  authMiddleware,
  async (req, res) => {

    try {

      const {
        uid,
        email,
        name,
      } = req.user;

      const existingCustomer =
await getPool().query(

  `
  SELECT *
  FROM customers
  WHERE firebase_uid = $1
  OR email = $2
  `,

  [uid, email]
);

      if (
existingCustomer.rows.length === 0
) {

  await getPool().query(

    `
    INSERT INTO customers (

      firebase_uid,
      name,
      email,
      biometric_enabled

    )

    VALUES ($1, $2, $3, $4)
    `,

    [
      uid,
      name || "Customer",
      email,
      false,
    ]
  );

  console.log(
    "Customer created"
  );

} else {

  await getPool().query(

    `
    UPDATE customers
    SET firebase_uid = $1
    WHERE email = $2
    `,

    [uid, email]
  );

  console.log(
    "Customer already exists"
  );
}
      res.json({

        success: true,
        message:
        "Customer synced",
      });

    } catch (error) {

      console.log(error);

      res.status(500).json({

        success: false,
        error: error.message,
      });
    }
  }
);


// ENABLE BIOMETRIC
router.post(
  "/enable-biometric",
  authMiddleware,
  async (req, res) => {

    try {

      const { uid } = req.user;

      await getPool().query(

        `
        UPDATE customers
        SET biometric_enabled = true
        WHERE firebase_uid = $1
        `,

        [uid]
      );

      res.json({

        success: true,
        message:
        "Biometric enabled",
      });

    } catch (error) {

      console.log(error);

      res.status(500).json({

        success: false,
        error: error.message,
      });
    }
  }
);


// DISABLE BIOMETRIC
router.post(
  "/disable-biometric",
  authMiddleware,
  async (req, res) => {

    try {

      const { uid } = req.user;

      await getPool().query(

        `
        UPDATE customers
        SET biometric_enabled = false
        WHERE firebase_uid = $1
        `,

        [uid]
      );

      res.json({

        success: true,
        message:
        "Biometric disabled",
      });

    } catch (error) {

      console.log(error);

      res.status(500).json({

        success: false,
        error: error.message,
      });
    }
  }
);

export default router;