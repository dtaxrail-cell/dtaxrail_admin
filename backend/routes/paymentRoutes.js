import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

import {
  getPayments,
  updatePaymentStatus,
} from "../controllers/paymentController.js";

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  getPayments
);

router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  updatePaymentStatus
);

export default router;