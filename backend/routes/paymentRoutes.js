import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

import {

  getPayments,
  updatePaymentStatus,

} from "../controllers/paymentController.js";

const router = express.Router();





// GET ALL PAYMENTS
router.get(

  "/",

  authMiddleware,
  adminMiddleware,

  getPayments
);





// UPDATE PAYMENT STATUS
router.put(

  "/filing/:filingId",

  authMiddleware,
  adminMiddleware,

  updatePaymentStatus
);

export default router;