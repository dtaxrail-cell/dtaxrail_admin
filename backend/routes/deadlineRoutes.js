import express from "express";

import authMiddleware  from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

import {
  getDeadlines,
  getAdminDeadlines,
  createDeadline,
  updateDeadline,
  deleteDeadline,
} from "../controllers/deadlineController.js";

const router = express.Router();



// CUSTOMER — GET ACTIVE DEADLINES (no auth)
router.get(
  "/",
  getDeadlines
);



// ADMIN — GET ALL DEADLINES
router.get(
  "/admin",
  authMiddleware,
  adminMiddleware,
  getAdminDeadlines
);



// ADMIN — CREATE DEADLINE
router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  createDeadline
);



// ADMIN — UPDATE DEADLINE
router.put(
  "/:deadlineId",
  authMiddleware,
  adminMiddleware,
  updateDeadline
);



// ADMIN — DELETE DEADLINE
router.delete(
  "/:deadlineId",
  authMiddleware,
  adminMiddleware,
  deleteDeadline
);

export default router;