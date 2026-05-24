import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

import {
  getCustomers,
} from "../controllers/customerController.js";

/*import {
  createCustomer,
} from "../controllers/customerController.js";*/

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  getCustomers
);

/*router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  createCustomer
);*/

export default router;