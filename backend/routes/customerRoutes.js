import express from "express";

import authMiddleware
from "../middleware/authMiddleware.js";

import adminMiddleware
from "../middleware/adminMiddleware.js";

import { getPool }
from "../config/db.js";

import {
  getCustomers,
} from "../controllers/customerController.js";

const router = express.Router();


// ADMIN - GET ALL CUSTOMERS
router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  getCustomers
);

// GET CURRENT CUSTOMER
router.get(
  "/me",
  authMiddleware,

  async (req, res) => {

    try {

      const { uid } = req.user;

      const result =
      await getPool().query(

        `
        SELECT *
        FROM customers
        WHERE firebase_uid = $1
        `,

        [uid]
      );

      if (
      result.rows.length === 0
      ) {

        return res.status(404).json({

          success: false,

          message:
          "Customer not found",
        });
      }

      res.json({

        success: true,

        customer:
        result.rows[0],
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
// CUSTOMER - UPDATE PHONE
router.post(
  "/update-phone",
  authMiddleware,

  async (req, res) => {

    try {

      const { phone } = req.body;

      const { uid } = req.user;

      if (!phone) {

        return res.status(400).json({

          success: false,
          message:
          "Phone number required",
        });
      }

      await getPool().query(

        `
        UPDATE customers
        SET phone = $1
        WHERE firebase_uid = $2
        `,

        [phone, uid]
      );

      res.json({

        success: true,

        message:
        "Phone updated successfully",
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